const app = require('express')();
const io = require('socket.io')(3001, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
const fs = require('fs');

let sceneCollection = [];
let serverFirstRun = true;
let collectionName = "";
let ini;

//constants and defaults
const version = "0.0.2";
const defaultPrefabJson = {"folders":[],"prefabs":[]}

const dictionary = [
  //collection CRUD (for prefab.json)
  {command: "collection_create", description: "Create prefabs.json file (if doesn't already exists)", locale: "remote", args: "None"},
  {command: "collection_read", description: "Read and return the prefabs.json file (if exists)", locale: "remote", args: "None"},
  {command: "collection_update", description: "Update the prefabs.json file (if exists)", locale: "remote", args: "1: The new prefab.json contents (must be in 'single quotes')"},
  {command: "collection_delete", description: "Delete the prefabs.json file", locale: "remote", args: "None"},
  {command: "collection_reset", description: "Reset the prefabs.json file to default skeleton (creates new if doesn't exist)", locale: "remote", args: "None"},
  //folder CRUD (for creating prefab folders within prefab.json)
  {command: "folder_add", description: "Create a new folder in prefabs.json", locale: "remote", args: "1: The folder's name (must be in 'single quotes')"},
  {command: "folder_read", description: "Returns all folders", locale: "remote", args: "None"},
  {command: "folder_update", description: "Update the list of folders", locale: "remote", args: "1: Folder list (must be seperated by comma and inside 'single, quotes')"},
  {command: "folder_delete", description: "Delete specified folder from list", locale: "remote", args: "1: Folder name (must be in 'single quotes')"},
  {command: "server_version", description: "Returns Open Newsroom server version", locale: "remote", args: "None"},
  {command: "server_test", description: "Test connection to the server", locale: "remote", args: "None"},
  {command: "server_help", description: "Display all the available commands from the server dictionary", locale: "remote", args: "None"},
]

fs.access("settings.ini", fs.F_OK, (err) => {
  if (err) {
    //wizard will go here, trigger when no settings.ini
    //for now, just create empty
    fs.writeFile("settings.ini", "{}", (err) => {
      if (err) return
    })
    fs.readFile("settings.ini", (err, data) => {
      if (err) return
      console.log("No settings.ini file found - created one (placeholder)")
      ini = JSON.parse(data)
    })
  } else {
    fs.readFile("settings.ini", (err, data) => {
      if (err) return
      ini = JSON.parse(data)
    })
  }
})

//CRUD for prefabs.json containing prefab elements, settings + folders
function collectionCreate() {
  let fsDir = fs.readdirSync('fs')
  if (fsDir.includes("prefabs.json")) {
    return false
  } else {
    fs.writeFileSync('fs/prefabs.json', JSON.stringify(defaultPrefabJson, null, 2))
    return true
  }
}

function collectionRead() {
  let fsDir = fs.readdirSync('fs')
  if (fsDir.includes("prefabs.json")) {
    return fs.readFileSync('fs/prefabs.json', {encoding:'utf8'})
  } else {
    return false
  }
}

function collectionUpdate(data) {
  if (data == "") {
    return "New prefab was empty"
  } else {
    let fsDir = fs.readdirSync('fs')
    if (fsDir.includes("prefabs.json")) {
      fs.writeFileSync('fs/prefabs.json', data, {encoding: "utf8"})
      return true
    } else {
      return false
    }
  }
}

function collectionDelete() {
  let fsDir = fs.readdirSync('fs')
  if (fsDir.includes("prefabs.json")) {
    fs.unlinkSync('fs/prefabs.json')
    return true
  } else {
    return false
  }
}

//extra function to reset collection to default
function collectionReset() {
  fs.writeFileSync('fs/prefabs.json', JSON.stringify(defaultPrefabJson, null, 2))
  return true
}

//CRUD for folders within the prefabs.json file
function folderAdd(folderName) {
  if (folderName == "") {
    throw "Folder name empty"
  } else {
    let collection = collectionRead()
    if (collection == false) {
      throw "Folder could not be created, prefabs.json does not exist"
    } else {
      let folderExists = false
      let tempCollection = JSON.parse(collection)
      if (tempCollection.folders === undefined) {
        tempCollection.folders = []
      } else {
        if (tempCollection.folders.includes(folderName)) {
          folderExists = true
        }
      }
      if (!folderExists) {
        tempCollection.folders.push(folderName)
        collectionUpdate(JSON.stringify(tempCollection, null, 2))
        return true
      } else {
        throw "Folder already exists in prefabs.json"
      }
    }
  }
}

function folderRead() {
  let collection = collectionRead()
  if (collection == false) {
    throw "Prefabs.json does not exist"
  } else {
    collection = JSON.parse(collection)
    if (collection.folders == undefined) {
      throw "Folder list does not exist"
    }
    if (collection.folders.length == 0) {
      throw "Folder list empty"
    }
    return collection.folders
  }
}

function folderUpdate(data) {
  if (data == "" || data == undefined) {
    throw "Argument was empty"
  } else {
    let splitData = data.split(",")
    let uniqueData = []
    for (var i=0;i<splitData.length;i++) {
      if (!uniqueData.includes(splitData[i].trim())) {
        uniqueData.push(splitData[i].trim())
      }
    }
    let collection = JSON.parse(readCollection())
    collection.folders = uniqueData
    collectionUpdate(JSON.stringify(collection, null, 2))
    return true
  }
}

function folderDelete(folderName) {
  let collection = collectionRead()
  if (collection == false) {
    throw "Folder could not be read, prefabs.json does not exist"
  } else {
    collection = JSON.parse(collection)
    const folderIndex = collection.folders.indexOf(folderName)
    if (folderIndex > -1) {
      collection.folders.splice(folderIndex, 1)
      collectionUpdate(JSON.stringify(collection, null, 2))
      return true
    } else {
      throw `Folder "${folderName}" does not exist in folders list`
    }
  }
}

io.on('connect', (socket) => {

  //return the command dictionary
  socket.on("getServerDictionary", (data, fn) => {
    fn(dictionary)
  })

  socket.on("console", (data, fn) => {
    console.log("recieved a client console message", data)
    if (data.trim() == "") {
      fn("Client message was empty")
      return
    }
    let trimmedData = data
    let params = false
    if (trimmedData.includes(" ")) {
      params = true
      trimmedData = trimmedData.split(" ")[0]
    }
    let redactedParamsMessage = "Additional parameters redacted before execution.\n"
    let folderName = "";
    switch(trimmedData) {
      //collection CRUD (json containing prefabs)
      case "collection_create":
        if (collectionCreate()) {
          fn(`Default "~/server/fs/prefabs.json" file created`)
        } else {
          fn("prefabs.json file already exists")
        }
        break;
      case "collection_read":
        if (collectionRead() == false) {
          fn("prefabs.json doesn't exist")
        } else {
          fn(collectionRead())
        }
        break;
      case "collection_update":
        if (data.indexOf("'") == -1) {
          fn("Failed: You must specify new data as an argument")
          return
        }
        let update = data.split("'")[1]
        if (collectionUpdate(update)) {
          fn("prefabs.json successfully updated")
        } else {
          fn("prefabs.json doesn't exist, create it first")
        }
        break;
      case "collection_delete":
        if (collectionDelete()) {
          fn("prefabs.json successfully deleted")
        } else {
          fn("prefabs.json doesn't exist, could not delete")
        }
        break;
      case "collection_reset":
        collectionReset()
        fn("Collection file reset to default")
        break;
      //create folders CRUD
      case "folder_add":
        if (data.indexOf("'") == -1) {
          fn("Failed: You must specify a folder name as an argument")
          return
        }
        folderName = data.split("'")[1]
        try {
          if (folderAdd(folderName)) {
            fn("Folder added successfully")
          }
        } catch (err) {
          fn(err)
        }
        break;
      case "folder_read":
        try {
          let tempReply = folderRead()
          if (tempReply!==false) {
            fn(JSON.stringify(tempReply))
          }
        } catch (err) {
          fn(err)
        }
        break;
      case "folder_update":
        if (data.indexOf("'") == -1) {
          fn("Failed: You must specify a new list to update folder list with")
          return
        }
        let newData = data.split("'")[1]
        try {
          if (folderUpdate(newData)) {
            fn("Prefab.json folders updated successfully")
          }
        } catch (err) {
          fn(err)
        }
        break;
      case "folder_delete":
        if (data.indexOf("'") == -1) {
          fn("Failed: You must specify a folder name as an argument")
          return
        }
        folderName = data.split("'")[1]
        try {
          if (folderDelete(folderName)) {
            fn(`Folder "${folderName}" deleted successfully`)
          }
        } catch (err) {
          fn(err)
        }
        break;
      //prefab CRUD
      case "prefab_add":
        if (data.indexOf("'") == -1) {
          fn("Failed: You must specify a prefab object (stringified)")
          return
        }
        try {
          element = data.split("'")[1]
          if (prefabAdd(element)) {
            fn("New prefab added to prefabs.json file")
          }
        } catch(err) {
          fn(err)
        }
        fn("Not yet implemented")
        break;
      case "prefab_read":
        fn("Not yet implemented")
        break;
      case "prefab_update":
        fn("Not yet implemented")
        break;
      case "prefab_delete":
        fn("Not yet implemented")
        break;
      case "server_version":
        fn(`Server Version: v${version}`)
        break;
      case "server_test":
        let d = new Date();
        let formDate = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
        let paramMessage = params?redactedParamsMessage:""
        fn(`${paramMessage}Your message was recieved by the server at: ${formDate} (server time)`)
        break;
      case "server_help":
        fn(dictionary.map(command => `${command.command} : ${command.description} (${command.locale}) - Args: ${command.args}`).join('\n'))
        break;
      default:
        fn(`Error: The command "${data}" was not recognised as a client-side or server-side dictionary command. Please enable "Peak Available Commands" or type "help" to view all available comannds.`)
        break;
    }
  })

  socket.emit('iniFile', ini)

  if (serverFirstRun) {
    fs.readdir('fs/collections', (err, files) => {
      io.emit('serverFirstRun', files)
    })
  }

  socket.on("clientSendScene", (data) => {
    io.emit("obsDisplay", data)
  })

  socket.on('chooseCollection', (name) => {
    collectionName = name
    reloadCollection()
  })

  function reloadCollection() {
    console.log(`Attempting to read "fs/collections/${collectionName}"`)
    if (fs.existsSync(`fs/collections/${collectionName}`)) {
      fs.readFile(`fs/collections/${collectionName}`, "utf8", (err, data) => {
        if (err) {console.log(err)}
        sceneCollection = JSON.parse(data)
        console.log("Read successful! Scene collection set")
      })
    } else {
      fs.writeFile(`fs/collections/${collectionName}`, "", (err) => {
        if (err) throw err;
        console.log('FS: Save File Updated')
      })
    }
  }

  io.emit('broadcastSceneCollection', sceneCollection);

  socket.on('addScene', (data) => {
    for (i=0;i<sceneCollection.length;i++) {
      console.log(`Checking if ${i} of sceneCollection is ${data.name}`)
      if (data.name == sceneCollection[i].name) {
        console.log(`Duplicate found! ${i} of sceneCollection was "${sceneCollection[i].name}"`)
        sceneCollection.splice(i, 1)
      }
    }
    sceneCollection.push(data)
    console.log(sceneCollection)
    io.emit('update-scene', data)
    fs.writeFile(`fs/collections/${collectionName}`, JSON.stringify(data), (err) => {
      if (err) throw err;
      console.log('FS: Save File Updated')
    })
  })

});