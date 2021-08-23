import { Dialog, DialogTitle, DialogContent, DialogContentText, FormControl, TextField, Typography, Grid, DialogActions, Button, Box, Select, InputLabel, MenuItem } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';

export default function NewPrefabDialog(props) {

  const [inputPrefabName, setInputPrefabName] = useState("")
    const [inputPrefabNameError, setInputPrefabNameError] = useState(false)
    const [prefabNameError, setPrefabNameError] = useState("")
  const [inputWidth, setInputWidth] = useState(props.placeholderWidth)
    const [inputWidthError, setInputWidthError] = useState(false)
    const [widthError, setWidthError] = useState("")
  const [inputHeight, setInputHeight] = useState(props.placeholderHeight)
    const [inputHeightError, setInputHeightError] = useState(false)
    const [heightError, setHeightError] = useState("")

  function handleClose() {
    props.onClose()
    handleResetForm()
  }

  function handleResetForm() {
    handleResetErrors()
    setInputPrefabName("")
    setInputWidth(props.placeholderWidth)
    setInputHeight(props.placeholderHeight)
  }

  function handleResetErrors() {
    setInputPrefabNameError(false)
    setInputWidthError(false)
    setInputHeightError(false)
    setPrefabNameError("")
    setWidthError("")
    setHeightError("")
  }

  function handleNewPrefab() {
    let nameError = false
    let widthError = false
    let heightError = false

    if (!parseInt(inputWidth)) {
      setWidthError("Must be number")
      setInputWidthError(true)
      widthError = true
    }
    if (!parseInt(inputHeight)) {
      setHeightError("Must be number")
      setInputHeightError(true)
      heightError = true
    }
    if (String(inputPrefabName) === '') {
      setPrefabNameError("Cannot be empty")
      setInputPrefabNameError(true)
      nameError = true
    }
    if (String(inputWidth) === '') {
      setWidthError("Cannot be empty")
      setInputWidthError(true)
      widthError = true
    }
    if (String(inputHeight) === '') {
      setHeightError("Cannot be empty")
      setInputHeightError(true)
      heightError = true
    }

    if (!nameError && !widthError && !heightError) {
      //Check unique name here
      props.io("exec", {query: {"function":"prefabReadAll"}}, (response) => {
        if (response.success) {
          let uniqueName = true;
          if (response.data.prefabList.includes(inputPrefabName)) {
            uniqueName = false
          } 
          if (uniqueName) {
            props.io("exec", {
              query: {
                "function": "prefabAdd",
                "prefabName": inputPrefabName,
                "settings": {
                  "width": inputWidth,
                  "height": inputHeight
                }
              }
            }, (response) => {
              if (response.success) {
                props.newPrefab(inputPrefabName, parseInt(inputWidth), parseInt(inputHeight))
                handleClose()
              } else {
                setPrefabNameError("Server error while creating prefab")
                console.log(response.data.error)
                setInputPrefabNameError(true)
              }
            })
          } else {
            setPrefabNameError("Prefab name already exists")
            setInputPrefabNameError(true)
          }
        } else {
          setPrefabNameError("Server error while creating prefab")
          console.log(response)
          setInputPrefabNameError(true)
        }
      })
    }
  }

  //For selecting a folder
  const [selectedFolder, setSelectedFolder] = useState('')
  const [availableFolders, setAvailableFolders] = useState([])
  const [displayNewFolder, setDisplayNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderError, setNewFolderError] = useState(false)
  const [inputNewFolderError, setInputNewFolderError] = useState("")

  const handleSelectFolder = (event) => {
    if (event.target.value === "_newfolder") {
      setDisplayNewFolder(true)
    } else {
      setDisplayNewFolder(false)
    }
    setSelectedFolder(event.target.value)
  }

  function handleUpdateFolderList() {
    props.io("exec", {query: {"function":"folderReadAll"}}, (response) => {
      if (response.success) {
        setAvailableFolders(response.data.folderList)
      } else {
        console.log(response)
      }
    })
  }

  useEffect(() => {
    setTimeout(handleUpdateFolderList, 2000)
  }, [])

  function handleCreateNewFolder() {
    props.io("exec", {query: {"function":"folderAdd", "folderName": newFolderName}}, (response) => {
      if (response.success) {
        handleUpdateFolderList()
        setDisplayNewFolder(false)
        setSelectedFolder(newFolderName)
      } else {
        setInputNewFolderError("Folder already exists")
        console.log(response)
        setNewFolderError(true)
      }
    })
  }

  return (
    <Dialog 
      open={props.open}
      aria-labelledby="newPrefabDialogTitle"
      aria-describedby="newPrefabDialogDescription"
      onClose={handleClose}
    >
      <DialogTitle id="newPrefabDialogTitle">Create New Prefab</DialogTitle>
       <DialogContent className="createRefabDialogContent">
         <DialogContentText id="newPrefabDialogDescription">
          <FormControl fullWidth>
            <TextField required 
              label="New Prefab Name" 
              defaultValue=""
              onChange={(e) => {
                setInputPrefabName(e.target.value)
              }}
              size="medium"
              error={inputPrefabNameError}
              helperText={prefabNameError}
              className="prefabNameField"
              onClick={() => {setInputPrefabNameError(false);setPrefabNameError("")}}
              autoFocus
            />
          </FormControl>
          <Typography className="AppbarTitle" style={{color:"#000",marginTop:"15px"}}>Prefab Size</Typography>
          <Grid container spacing={2} className="prefabSize">
            <Grid item xs={6}>
              <TextField required
                label="Width"
                defaultValue={props.placeholderWidth}
                onChange={(e) => {
                  setInputWidth(e.target.value)
                }}
                error={inputWidthError}
                helperText={widthError}
                onClick={() => {setInputWidthError(false);setWidthError("")}}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField required
                label="Height"
                defaultValue={props.placeholderHeight}
                onChange={(e) => {
                  setInputHeight(e.target.value)
                }}
                error={inputHeightError}
                helperText={heightError}
                onClick={() => {setInputHeightError(false);setHeightError("")}}
              />
            </Grid>
          </Grid>

          <FormControl fullWidth className="labelTopMargin">
            <InputLabel>Folder</InputLabel>
            <Select
              value={selectedFolder}
              onChange={handleSelectFolder}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {availableFolders?.map(folder => (<MenuItem key={folder} value={folder}>{folder}</MenuItem>))}
              <MenuItem value="_newfolder">New Folder...</MenuItem>
            </Select>
          </FormControl>

          <Box component="div" className="labelTopMargin" display={displayNewFolder?"block":"none"}>
            <Grid container spacing={2}>
              <Grid item>
                <TextField
                  id="newFolderName"
                  label="Folder"
                  size="small"
                  onChange={(e) => {setNewFolderName(e.target.value)}}
                  error={newFolderError}
                  helperText={inputNewFolderError}
                  onClick={() => {setNewFolderError(false);setInputNewFolderError("")}}
                />
              </Grid>
              <Grid item>
                <Button variant="contained" color="primary" size="small" startIcon={<CreateNewFolderIcon/>} onClick={handleCreateNewFolder}>
                  Add
                </Button>
              </Grid>
            </Grid>
          </Box>

        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleNewPrefab} variant="contained" color="primary" startIcon={<NoteAddIcon/>}>
          Create New Prefab
        </Button>
      </DialogActions>
    </Dialog>
  )
}