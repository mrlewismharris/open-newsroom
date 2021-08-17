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
const validPrefabTypes = ["text", "box", "image"]

const dictionary = [
  //collection CRUD (for prefab.json)
  {command: "collection_create", description: "Create prefabs.json file (if doesn't already exists)", locale: "remote", args: "None"},
  {command: "collection_read", description: "Read and return the prefabs.json file (if exists)", locale: "remote", args: "None"},
  {command: "collection_update", description: "Update the prefabs.json file (if exists)", locale: "remote", args: "1: The new prefab.json contents (must be in 'single quotes')"},
  {command: "collection_delete", description: "Delete the prefabs.json file", locale: "remote", args: "None"},
  {command: "collection_reset", description: "Reset the prefabs.json file to default skeleton (creates new if doesn't exist)", locale: "remote", args: "None"},
  //folder CRUD (for creating prefab folders within prefab.json)
  {command: "folder_add", description: "Create a new folder in prefabs.json", locale: "remote", args: "1: The folder's name (must be in 'single quotes')"},
  {command: "folder_read", description: "Returns all folders, unless a folder name is specified", locale: "remote", args: "(Optional) 1: Folder name in 'single quotes'"},
  {command: "folder_update", description: "Update the list of folders", locale: "remote", args: "1: Folder list (must be seperated by comma and inside 'single, quotes')"},
  {command: "folder_delete", description: "Delete specified folder from list", locale: "remote", args: "1: Folder name (must be in 'single quotes')"},
  //prefab CRUD (for adding individual prefab to prefab.json)
  {command: "prefab_add", description: "Add prefab to prefabs.json", locale: "remote", args: `1: Stringified prefab object in 'single quotes'. Name required, optional: Elements, folder, transition, quick settings list (quick)`},
  {command: "prefab_read", description: "Returns a list of prefabs from prefab.json, or an individual prefab object as string when using prefab name as arg", locale: "remote", args: "(Optional) 1: Prefab name in 'single quotes'"},
  {command: "prefab_update", description: "Update a specific prefab", locale: "remote", args: "1: Stringified prefab object in 'single quotes', same as prefab_add - prefab must already exist to update"},
  {command: "prefab_delete", description: "Delete a prefab from prefabs.json", locale: "remote", args: "1: Prefab name in 'single quotes'"},
  {command: "prefab_validate", description: "Validate prefab", locale: "remote", args: "1: Prefab object in 'single quotes'"},
  //prefab element qCRUD - add elements to a prefab
  {command: "element_validate", description: "Validate element", locale: "remote", args: "1: Element object in 'single quotes' (requires a name, optionally css and transitions will be added if blank)"},

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

function folderReadAll() {
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

function folderRead(foldername) {
  try {
    let folders = folderReadAll()
    if (folders) {
      if (folders.includes(foldername)) {
        return JSON.parse(collectionRead()).prefabs.filter(prefab => prefab.folder == foldername).map(prefab => prefab.name)
      } else {
        throw "Folder name does not exist"
      }
    }
  } catch (err) {
    throw err
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

//CRUD functions for prefabs

function prefabAdd(prefab) {
  if (prefab == "") {
    throw "Prefab empty"
  } else {
    let collection = collectionRead()
    if (collection == false) {
      throw "Prefab could not be created, prefabs.json does not exist"
    } else if (!JSON.parse(collection).hasOwnProperty("prefabs")) {
      throw "Prefabs.json is not formatted corrently (needs 'prefabs' property)"
    } else {
      try {
        let prefabObject = prefabValidate(prefab)
        console.log(prefabObject)
        if (prefabObject !== false) {
          prefabObject = JSON.parse(prefabObject)
          let tempCollection = JSON.parse(collectionRead())
          if (tempCollection.prefabs.map(fab => fab.name == prefabObject.name).length == 0) {
            tempCollection.prefabs.push(prefabObject)
            collectionUpdate(JSON.stringify(tempCollection, null, 2))
            return true
          } else {
            throw `Could not add prefab becsause "${prefabObject.name}" already exists`
          }
        }
      } catch (err) {
        throw err
      }
    }
  }
}

function prefabReadAll() {
  let prefabList = JSON.parse(collectionRead()).prefabs
  if (prefabList.length == 0) {
    throw "Prefab list empty"
  } else {
    return prefabList.map(prefab => prefab.name)
  }
}

function prefabRead(name) {
  let prefabList = JSON.parse(collectionRead()).prefabs
  if (prefabList.find(prefab => prefab.name == name)) {
    return prefabList.find(prefab => prefab.name == name)
  } else {
    throw "Prefab name does not exist"
  }
}

function prefabUpdate(prefab) {
  if (prefab == "") {
    throw "Prefab was empty"
  } else {
    let collection = collectionRead()
    if (collection == false) {
      throw "Folder could not be created, prefabs.json does not exist"
    } else if (!JSON.parse(collection).hasOwnProperty("prefabs")) {
      throw "Prefabs.json is not formatted corrently (needs 'prefabs' property)"
    } else {
      try {
        let prefabObject = prefabValidate(prefab)
        console.log(prefabObject)
        if (prefabObject) {
          prefabObject = JSON.parse(prefabObject)
          let tempCollection = JSON.parse(collection)
          if (tempCollection.prefabs.map(fab => fab.name == prefabObject.name).length > 0) {
            tempCollection.prefabs = tempCollection.prefabs.filter(prefab => prefab.name !== prefabObject.name)
            tempCollection.prefabs.push(prefabObject)
            collectionUpdate(JSON.stringify(tempCollection, null, 2))
            return true
          } else {
            throw `Prefab must exist first to be updated - no prefab with name "${prefabObject.name}" found`
          }
        }
      } catch (err) {
        throw err
      }
    }
  }
}

function prefabDelete(name) {
  if (name == "") {
    throw "Prefab name was empty"
  } else {
    let tempCollection = JSON.parse(collectionRead())
    if (!tempCollection.prefabs.find(prefab => prefab.name == name)) {
      throw `Prefab with name "${name}" doesn't exist`
    } else {
      tempCollection.prefabs = tempCollection.prefabs.filter(prefab => prefab.name !== name)
      collectionUpdate(JSON.stringify(tempCollection, null, 2))
      return true
    }
  }
}

function prefabValidate(prefab) {
  let collection = collectionRead()
  let prefabObject = JSON.parse(prefab)
  let errors = ""
  function addError(err) {if (errors.length > 0) {errors += `, ${err.toLowerCase()}`} else {errors = err}}
  if (!prefabObject.hasOwnProperty("name")) {addError("Prefab must have a name field")}
  if (prefabObject.hasOwnProperty("elements")) {
    if (prefabObject.elements.length > 0) {
      //Do element validation here, loop thru elements and validate each in try/catch
      prefabObject.elements.forEach(el => {
        try {
          //elementValidate(el)
        } catch (err) {
          addError(err)
        }
      })
    }
  } else {prefabObject.elements = []}
  if (prefabObject.hasOwnProperty("folder")) {
    if (prefabObject.folder !== "") {
      if (!JSON.parse(collection).folders.includes(prefabObject.folder)) {
        folderAdd(prefabObject.folder)
        collection = collectionRead()
      }
    }
  } else {prefabObject.folder = ""}
  if (prefabObject.hasOwnProperty("transition")) {
    if (prefabObject.transition !== "") {
      //here validate that the transition ref exists
      /**
      if (collection.transitions.hasOwnProperty("transitions")) {
        if (!collection.transition.includes(prefabObject.transition)) {
          addError(`Transition reference ${prefabObject.transition} does not exist`)
        }
      } else {
        addError("While checking transition reference was valid noticed prefab.json doesn't have a transition property - please add or use collection_reset (will delete all data)")
      }
      **/
    }
  } else {
    prefabObject.transition = ""
  }
  if (!prefabObject.hasOwnProperty("quick")) {
    prefabObject.quick = []
  } else {
    if (!Array.isArray(prefabObject.quick)) {
      addError("Prefab quick settings item must be array")
    } else {
      //Make sure that the element exists to be set
      let elementNameList = prefabObject.elements.map(el => el.name)
      prefabObject.quick.forEach(setting => {
        if (typeof setting == "string") {
          if (!elementNameList.includes(setting)) {
            addError(`Quick setting element ${setting} doesn't exist in prefab elements list`)
          }
        } else {
          addError("Prefab's quick settings aren't properly formatted")
        }
      })
    }
  }
  if (prefabObject.name == "") {addError("Prefab name field was empty")}
  if (errors.length > 0) {
    throw errors
  } else {
    //let existingPrefabs = JSON.parse(collection).prefabs.map(prefab => prefab.name)
    //if (existingPrefabs.includes(prefabObject.name)) {addError("Prefab name already exists")}
    if (!Array.isArray(prefabObject.elements)) {addError(`Invalid "elements" property, must be array`)}
    if (errors.length > 0) {
      throw errors
    } else {
      return JSON.stringify(prefabObject)
    }
  }
}

//qCRUD functions for prefab elements
function prefabAddElement(prefabName, element) {

}

function prefabReadElement(prefabName, elementName) {

}

function prefabReadAllElements(prefabName) {

}

function prefabUpdateElement(prefabName, elementObject) {

}

function prefabRemoveElement(prefabName, elementName) {

}

function prefabValidateElement(element) {
  element = JSON.parse(element)
  let errors = ""
  function addError(err) {if (errors.length > 0) {errors += `, ${err.toLowerCase()}`} else {errors = err}}
  if (!element.hasOwnProperty("name")) {addError("Prefab elements require a name field")}
  if (!element.hasOwnProperty("css")) {element.css = {}}
  if (!element.hasOwnProperty("transitions")) {element.transition = {}}
  if (errors.length > 0) {
    throw errors
  }
  if (element.name="") {addError("Prefab cannot have an empty name field")}
  if (typeof element.css !== "object") {addError("Prefab css field must be an object")}
  if (typeof element.transition !== "object") {addError("Prefab transition field must be an object")}
  if (errors.length > 0) {
    throw errors
  }
  if (errors.length == 0) {
    return JSON.stringify(element)
  } else {
    return false
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
        if (data.indexOf("'") == -1) {
          try {
            let tempReply = folderReadAll()
            if (tempReply!==false) {
              fn(JSON.stringify(tempReply))
            }
          } catch (err) {
            fn(err)
          }
        } else {
          try {
            let out = folderRead(data.split("'")[1])
            if (out !== false) {
              fn(JSON.stringify(out))
            }
          } catch (err) {
            fn(err)
          }
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
            fn(`New prefab ${JSON.parse(element).name} added to prefabs.json file`)
          }
        } catch(err) {
          console.log(err)
          fn(err)
        }
        fn("Not yet implemented")
        break;
      case "prefab_read":
        if (data.indexOf("'") == -1) {
          try {
            let out = JSON.stringify(prefabReadAll())
            if (out !== false) {
              fn(out)
            }
          } catch (err) {
            fn(err)
          }
        } else {
          try {
            let out = JSON.stringify(prefabRead(data.split("'")[1]), null, 2)
            if (out !== false) {
              fn(out)
            }
          } catch (err) {
            fn(err)
          }
        }
        break;
      case "prefab_update":
        if (data.indexOf("'") > -1) {
          try {
            if (prefabUpdate(data.split("'")[1])) {
              fn(`Prefab "${JSON.parse(data.split("'")[1]).name}" updated successfully`)
            }
          } catch(err) {
            fn(err)
          }
        } else {
          fn("prefab_update requires the argument: prefab object in 'single quotes'")
        }
        break;
      case "prefab_delete":
        if (data.indexOf("'") > -1) {
          try {
            if (prefabDelete(data.split("'")[1])) {
              fn(`Prefab "${data.split("'")[1]}" successfully deleted`)
            }
          } catch (err) {
            fn(err)
          }
        } else {
          fn("prefab_delete requires a prefab name as an argument (in 'single quotes')")
        }
        break;
      case "prefab_validate":
        if (data.indexOf("'") > -1) {
          try {
            if (prefabValidate(data.split("'")[1])) {
              fn("Prefab validated successfully")
            }
          } catch (err) {
            fn(`Prefab not valid: ${JSON.stringify(err)}`)
          }
        } else {
          fn("prefab_validate requires a prefab object as an argument in 'single quotes'")
        }
        break;
      case "element_validate":
        if (data.indexOf("'") > -1) {
          try {
            let exec = prefabValidateElement(data.split("'")[1])
            if (exec !== false) {
              fn(exec)
            }
          } catch (err) {
            fn(`Prefab not valid: ${JSON.stringify(err)}`)
          }
        } else {
          fn("element_validate requires a prefab object as an argument in 'single quotes'")
        }
        break;
      case "prefab_add_element":
        //needs prefab name + element object
        fn("Function not yet implemented")
        break;
      case "prefab_read_element":
        //needs prefab name + element name
        fn("Function not yet implemented")
        break;
      case "prefab_update_element":
        //needs prefab name + element object
        fn("Function not yet implemented")
        break;
      case "prefab_remove_element":
        //needs prefab name + element name
        fn("Function not yet implemented")
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