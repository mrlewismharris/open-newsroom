import { Dialog, DialogTitle, DialogContent, DialogContentText, FormControl, TextField, Typography, Grid, DialogActions, Button } from '@material-ui/core';
import React, { useState } from 'react';
import NoteAddIcon from '@material-ui/icons/NoteAdd';

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
      let uniqueName = true;
      if (response.data.prefabList.includes(inputPrefabName)) {
        uniqueName = false
      } 
      if (uniqueName) {
        props.newPrefab(inputPrefabName, parseInt(inputWidth), parseInt(inputHeight))
        handleClose()
      } else {
        setPrefabNameError("Prefab name already exists")
        setInputPrefabNameError(true)
      }
    })
  }

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