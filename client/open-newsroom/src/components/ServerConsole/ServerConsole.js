import { AppBar, Button, Checkbox, Container, Dialog, FormControlLabel, IconButton, Slide, TextField, Toolbar, Tooltip, Typography } from "@material-ui/core";
import React, { useEffect, useRef, useState } from "react";
import CloseIcon from '@material-ui/icons/Close';
import './ServerConsole.css'

const Transition = React.forwardRef(function Transition(props, ref) {
  // @ts-ignore
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ServerConsole(props) {

  const inputRef = useRef();

  const initialConsole = `Open Newsroom Server Console v0.0.1\n\nStart typing or execute "help" to see available commands\n\n`
  const [contents, setContents] = useState(initialConsole)
  const [previewCommands, setPreviewCommands] = useState(true)

  function closeConsole() {
    setContents(initialConsole)
    props.onClose()
  }

  function sniffCommand(text) {
    if (text[0] === "!") {
      
    }
  }

  function execute(target) {
    let d = new Date()
    let formDate = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
    setContents(contents + "\n" + formDate + " >>> " + target.value)
  }

  return (
    <Dialog
      onClick={() => {
        // @ts-ignore
        inputRef.current.focus()
      }}
      fullScreen
      className="ServerConsole"
      open={props.open}
      onClose={closeConsole}
      // @ts-ignore
      TransitionComponent={Transition}
      style={{background: "#000"}}
    >
      <AppBar>
        <Toolbar>
          <IconButton className="AppbarExit" edge="start" color="inherit" onClick={closeConsole} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography className="AppbarTitle" variant="h6">Server Console</Typography>
          <Tooltip title="View available commands as you type">
            <FormControlLabel
              control={
                <Checkbox
                  checked={previewCommands}
                  onChange={() => {setPreviewCommands(!previewCommands)}}
                  name="PreviewCommands"
                  style={{color: "#fff"}}
                />
              }
              label="Instant Preview"
            />
          </Tooltip>
          <Button
            //ref={anchorRef_File}
            variant="contained"
            color="secondary"
            className="AppbarButton"
            onClick={() => {console.log("button clicked")}}
          >Documentation</Button>
        </Toolbar>
      </AppBar>

      <Container fixed className="consoleContainer">
        <textarea readOnly={true} className="terminalText" value={contents}/>
      </Container>
      <Container
        fixed
        className="consoleInput"
      >
        <TextField
          inputRef={inputRef}
          autoFocus
          className="consoleInputText"
          fullWidth
          margin="normal"
          onKeyDown={(e) => {
            if (e.code === "Enter") {
              execute(e.target)
              // @ts-ignore
              e.target.value=""
            }
          }}
          onChange={(e) => {
            sniffCommand(e.target.value)
          }}
        />
      </Container>
    </Dialog>
  );
}