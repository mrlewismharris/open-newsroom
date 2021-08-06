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

let version = "0.0.1";

const dictionary = [
  {command: "collection_create", description: "Create prefabs.json file (if doesn't already exists)", locale: "remote",
    args: "None"},
  {command: "collection_read", description: "Read and return the prefabs.json file (if exists)", locale: "remote",
    args: "None"},
  {command: "collection_update", description: "Update the prefabs.json file (if exists)", locale: "remote",
      args: "1: The new prefab.json contents (must be in 'single quotes')"},
  {command: "collection_delete", description: "Delete the prefabs.json file", locale: "remote",
    args: "None"},
  {command: "server_version", description: "Returns Open Newsroom server version", locale: "remote",
    args: "None"},
  {command: "server_test", description: "Test connection to the server", locale: "remote",
    args: "None"},
  {command: "server_help", description: "Display all the available commands from the server dictionary", locale: "remote",
      args: "None"},
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

//create json file containing prefab collections
function createCollection() {
  let fsDir = fs.readdirSync('fs')
  if (fsDir.includes("prefabs.json")) {
    return "prefabs.json already exists"
  } else {
    fs.writeFileSync('fs/prefabs.json', '[]')
    return "prefabs.json created"
  }
}

//read json file containing prefab collections
function readCollection() {
  let fsDir = fs.readdirSync('fs')
  if (fsDir.includes("prefabs.json")) {
    return fs.readFileSync('fs/prefabs.json', {encoding:'utf8'})
  } else {
    return "prefabs.json doesn't exist"
  }
}

function updateCollection(data) {
  if (data == "") {
    return "New prefab was empty"
  } else {
    let fsDir = fs.readdirSync('fs')
    if (fsDir.includes("prefabs.json")) {
      fs.writeFileSync('fs/prefabs.json', data, {encoding: "utf8"})
      return "prefabs.json successfully updated"
    } else {
      return "prefabs.json doesn't exist, create it first"
    }
  }
}

function deleteCollection() {
  let fsDir = fs.readdirSync('fs')
  if (fsDir.includes("prefabs.json")) {
    fs.unlinkSync('fs/prefabs.json')
    return "prefabs.json successfully deleted"
  } else {
    return "prefabs.json doesn't existm, could not delete"
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
    switch(trimmedData) {
      //collection CRUD (json containing prefabs)
      case "collection_create":
        fn(createCollection())
        break;
      case "collection_read":
        fn(readCollection())
        break;
      case "collection_update":
        let update = data.split("'")[1]
        fn(updateCollection(update))
        break;
      case "collection_delete":
        fn(deleteCollection())
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