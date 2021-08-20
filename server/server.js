//ports
const ioPort  = 3001
const displayPort = 3002

const io = require('socket.io')(ioPort, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
const { response } = require('express');
const fs = require('fs');

let sceneCollection = [];
let serverFirstRun = true;
let collectionName = "";
let ini;
let customPlaceholderText = "Placeholder"

//constants and defaults
const version = "0.0.3";
const defaultPrefabJson = {"folders":[],"prefabs":[]}
const validPrefabTypes = ["text", "box", "media"]

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
  {command: "element_validate", description: "Validate element", locale: "remote", args: "1: Element object in 'single quotes' requires a name and type, optionally css and transitions will be added if blank, if type is text, placeholder text is added"},
  {command: "prefab_reset_elements", description: "Resets the element field of the prefab object to default (empty) state", locale: "remote", args: "1: Prefab name in 'single quotes'"},
  {command: "prefab_add_element", description: "Add elements to a prefab", locale: "remote", args: "1: Prefab name in 'single quotes' to add element to, 2: Element object in 'single quotes' (requires a name, optionally css and transitions will be added if blank)"},
  {command: "prefab_read_elements", description: "Return list of all elements in prefab, or single elements with 2nd arg", locale: "remote", args: "1: Prefab name in 'single quotes', (Optional) 2: Element object name in 'single quotes'"},
  {command: "prefab_update_element", description: "Update an element in a prefab", locale: "remote", args: "1: Prefab name in 'single quotes', 2: Element object in 'single quotes'"},
  {command: "prefab_remove_element", description: "Remove element from prefab", locale: "remote", args: "1: Prefab name in 'single quotes', 2: Element name in 'single quotes'"},
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
  if (!prefab.includes("{")) {throw "Prefab Validate arg must be a prefab object"}
  let collection = collectionRead()
  let prefabObject = prefab
  if (typeof prefabObject !== "object") {prefabObject = JSON.parse(prefab)}
  let errors = ""
  function addError(err) {if (errors.length > 0) {errors += `, ${err.toLowerCase()}`} else {errors = err}}
  if (!prefabObject.hasOwnProperty("name")) {addError("Prefab must have a name field")}
  if (prefabObject.hasOwnProperty("elements")) {
    if (prefabObject.elements.length > 0) {
      //Do element validation here, loop thru elements and validate each in try/catch
      prefabObject.elements.forEach(el => {
        try {
          if (prefabValidateElement(el)) {
            el = prefabValidateElement(el)
          }
        } catch (err) {
          addError(err)
        }
      })
    }
  } else {prefabObject.elements = []}
  if (prefabObject.hasOwnProperty("settings")) {
    if (typeof prefabObject.settings !== "object") {
      addError("Prefab settings aren't object")
    }
  } else {prefabObject.settings = {}}
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
  let prefab = prefabRead(prefabName)
  if (typeof element !== "object") {element = JSON.parse(element)}
  //validate args
  if (prefab == false) {throw "Prefab name doesn't exist"}
  if (typeof element !== "object") {throw "Element object must be an object in 'single quotes'"}
  try {
    element = JSON.parse(prefabValidateElement(element))
  } catch(err) {
    throw err
  }
  if (prefab.elements.filter(el => el.name == element.name).length > 0) {
    let highest = 0
    let duplicatesList = prefab.elements.map(el => el.name).filter(el => el.startsWith(element.name) && el.includes("_")).map(el => el.substring(el.lastIndexOf("_") + 1, el.length))
    if (duplicatesList.length > 0) {
      console.log(duplicatesList)
      highest = Math.max(...duplicatesList)
    }
    element.name += "_" + (highest + 1)
  }
  prefab.elements.push(element)
  try {
    if (prefabUpdate(JSON.stringify(prefab, null, 2))) {
      return true
    }
  } catch(err) {
    throw err
  }
}

function prefabReadElement(prefabName, elementName) {
  let prefab = prefabRead(prefabName)
  if (prefab == false) {throw "Prefab name doesn't exist"}
  if (prefab.elements.filter(el => el.name == elementName).length > 0) {
    return prefab.elements.find(el => el.name == elementName)
  } else {
    return false
  }
}

function prefabReadAllElements(prefabName) {
  let prefab = prefabRead(prefabName)
  if (prefab == false) {
    throw "Prefab name doesn't exist"
  } else {
    return prefab.elements
  }
}

function prefabUpdateElement(prefabName, element) {
  let prefab = prefabRead(prefabName)
  if (prefab == false) {
    throw "Prefab name doesn't exist"
  } else {
    if (!element.includes("{") || !element.includes("}")) {throw "Element object formatted incorrectly"}
    if (typeof element !== "object") {element = JSON.parse(element)}
    if (!prefab.elements.find(el => el.name == element.name)) {throw "Element doesn't exist - use prefabAddElement instead"}
    try {
      element = JSON.parse(prefabValidateElement(element))
    } catch(err) {
      throw err
    }
    prefab.elements = prefab.elements.filter(el => el.name !== element.name)
    prefab.elements.push(element)
    try {
      if (prefabUpdate(JSON.stringify(prefab))) {
        return true
      }
    } catch (err) {
      throw err
    }
  }
}

function prefabRemoveElement(prefabName, elementName) {
  let prefab = prefabRead(prefabName)
  if (prefab == false) {
    throw "Prefab name doesn't exist"
  }
  if (!prefab.elements.find(el => el.name == elementName)) {throw `Element doesn't exist in ${prefabName}`}
  prefab.elements = prefab.elements.filter(el => el.name !== elementName)
  try {
    if (prefabUpdate(JSON.stringify(prefab))) {
      return true
    }
  } catch (err) {
    throw err
  }
}

function prefabResetElements(prefabName) {
  if (prefabName || prefabName !== "") {
    let prefabExists = prefabRead(prefabName)
    if (prefabExists !== false) {
      let prefab = prefabExists
      if (typeof prefab !== "object") {prefab = JSON.parse(prefab)}
      prefab.elements = []
      prefabUpdate(JSON.stringify(prefab))
    } else {
      throw `Prefab ${prefabName} doesn't exist`
    }
  } else {
    throw "Arg prefab name wasn't sent"
  }
}

function prefabValidateElement(element) {
  if (typeof element !== "object") {element = JSON.parse(element)}
  let errors = ""
  function addError(err) {if (errors.length > 0) {errors += `, ${err.toLowerCase()}`} else {errors = err}}
  if (!element.hasOwnProperty("name")) {addError("Prefab elements require a name field")}
  if (!element.hasOwnProperty("css")) {element.css = {}}
  if (!element.hasOwnProperty("transitions")) {element.transition = {}}
  if (!element.hasOwnProperty("type")) {
    element.type = "box"
  } else {
    if (!validPrefabTypes.includes(element.type)) {
      addError(`Prefab type must be one of: ${validPrefabTypes.join(", ")}`)
    }
  }
  if (!element.hasOwnProperty("text")) {element.text = customPlaceholderText}
  if (errors.length > 0) {
    throw errors
  }
  if (element.name=="") {addError("Prefab cannot have an empty name field")}
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
        if (data.indexOf("'") > -1) {
          if (data.split("'").length == 5) {
            try {
              if (prefabAddElement(data.split("'")[1], data.split("'")[3])) {
                fn(`Element object successfully added to ${data.split("'")[1]}`)
              }
            } catch (err) {
              console.log(err)
              fn(`Prefab_add_element error: ${JSON.stringify(err)}`)
            }
          } else {
            fn("Prefab_add_element requires 2 args: prefab name in 'single quotes', and element object in 'single quotes'")
          }
        } else {
          fn("Prefab_add_element requires 2 args: prefab name in 'single quotes', and element object in 'single quotes'")
        }
        break;
      case "prefab_read_elements":
        if (data.indexOf("'") > -1) {
          if (data.split("'").length == 5) {
            try {
              let returned = prefabReadElement(data.split("'")[1], data.split("'")[3])
              if (returned.length !== false) {
                fn(JSON.stringify(returned))
              } else {
                fn(`Prefab "${data.split("'")[1]}" elements list is empty`)
              }
            } catch (err) {
              console.log(err)
              fn(`Prefab_read_elements error: ${JSON.stringify(err)}`)
            }
          } else if (data.split("'").length == 3) {
            try {
              let returned = prefabReadAllElements(data.split("'")[1])
              if (returned.length > -1) {
                fn(JSON.stringify(returned))
              } else {
                fn(`Prefab "${data.split("'")[1]}" elements list is empty`)
              }
            } catch (err) {
              console.log(err)
              fn(`Prefab_read_elements error: ${JSON.stringify(err)}`)
            }
          }
        } else {
          fn("Prefab_read_element requires 2 args: Prefab name and element name, both in 'single quotes'")
        }
        break;
      case "prefab_update_element":
        if (data.split("'").length == 5) {
          let prefabName = data.split("'")[1]
          let elementObject = data.split("'")[3]
          try {
            if (prefabUpdateElement(prefabName, elementObject)) {
              fn(`Prefab "${prefabName}" element "${JSON.parse(elementObject).name}" was updated sucessfully`)
            }
          } catch (err) {
            console.log(err)
            fn(`Prefab_read_element error: ${JSON.stringify(err)}`)
          }
        } else {
          fn("Prefab_update_element requires 2 args: Prefab name and element object, both in 'single quotes'")
        }
        break;
      case "prefab_remove_element":
        if (data.split("'").length == 5) {
          let prefabName = data.split("'")[1]
          let elementName = data.split("'")[3]
          try {
            if (prefabRemoveElement(prefabName, elementName)) {
              fn(`Element "${elementName}" was successfully removed from "${prefabName}"`)
            }
          } catch (err) {
            console.log(err)
            fn(`Prefab_remove_element error: ${JSON.stringify(err)}`)
          }
        } else {
          fn("Prefab_remove_element requires 2 args: Prefab name and element name, both in 'single quotes'")
        }
        break;
        break;
      case "prefab_reset_elements":
        if (data.indexOf("'") > -1) {
          try {
            if (prefabResetElements(data.split("'")[1]) !== false) {
              fn(`Prefab ${data.split("'")[1]} reset successfully`)
            }
          } catch (err) {
            console.log(err)
            fn(JSON.stringify(err))
          }
        } else {
          fn("Prefab_reset_elements requires prefab name in 'single quotes' as arg")
        }
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

  socket.on('exec', (data, fn) => {
    if (typeof data.query.function == 'undefined' || data.query.function == "") {
      fn({"success":false,"data":"Function was undefined or empty"})
      return false
    }
    let command = data.query.function
    switch(command) {
      case "prefabExists":
        if (prefabRealAll())
        break;
      case "prefabReadAll":
        try {
          let output = prefabReadAll()
          fn({"success":true,"data":{"prefabList":output}})
        } catch(err) {
          fn({"success":false,"data":{"error":JSON.stringify(err)}})
        }
        break;
      case "prefabAdd":
        try {
          console.log()
        } catch(err) {
          fn({"success":false,"data":{"error":JSON.stringify(err)}})
        }
        break;
      default:
        fn({"success":false,"data":"Function not found"})
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

  io.on('clientTestConnection', () => {
    io.emit('obsConnect')
  })

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

//the OBS connection serve
let http = require('http')

//obs-display global vars


let fsDir = fs.readdirSync('fs')
if (!fsDir.includes("display.json")) {
  fs.writeFileSync('fs/display.json', JSON.stringify(defaultPrefabJson, null, 2))
}

http.createServer((req, res) => {
  let path = "public" + req.url
  if (path == "public/") {path = "public/index.html"}
  let extension = path.split(".")[path.split(".").length-1]
  let contentType = "text/html"
  if (extension == "js") {contentType = "text/javascript"}
  if (extension == "css") {contentType = "text/css"}
  if (!path.includes("&transport=polling")) {
    fs.readFile(path, "utf-8", (err, content) => {
      if (err) {
        if (err.code == 'ENOENT') {
          res.writeHead(404, {'Content-Type': contentType})
          res.end("404 - File not found" + err.code, "utf-8")
        } else {
          res.writeHead(500)
          res.end("500 - Unknown Error")
        }
      } else {
        res.writeHead(200, {'Content-Type': contentType})
        res.end(content, 'utf-8')
      }
    })
  }
}).listen(displayPort)