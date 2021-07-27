import { AppBar, Checkbox, Container, Dialog, FormControlLabel, IconButton, Slide, TextField, Toolbar, Tooltip, Typography } from "@material-ui/core";
import React, { useRef, useState } from "react";
import CloseIcon from '@material-ui/icons/Close';
import './ServerConsole.css'
import CommandPopper from "./CommandPopper";

const Transition = React.forwardRef(function Transition(props, ref) {
  // @ts-ignore
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ServerConsole(props) {

  const inputRef = useRef();
  const consoleRef = useRef();

  const initialConsole = `Open Newsroom Server Console v0.0.1\n\nStart typing or execute "help" to see available commands\n`
  const [serverConsole, setServerConsole] = useState(initialConsole)
  const [previewCommands, setPreviewCommands] = useState(true)

  //command popper states
  const [commandPopperAnchor, setCommandPopperAnchor] = useState(null)
  const [commandPopperContent, setCommandPopperContent] = useState([])
  //test data for the popper
  const testData = [
    {command: "version", description: "Returns Open Newsroom version(s)", locale: "local"},
    {command: "test", description: "Test connection to the server", locale: "remote"},
  ]

  function closeConsole() {
    setServerConsole(initialConsole)
    props.onClose()
  }

  function sniffCommand(event) {
    let input = event.target.value
    let searchedArray = []
    testData.forEach(item => {
      if (item.command.includes(input)) {
        searchedArray.push(item)
      }
    })
    setCommandPopperAnchor(event.currentTarget)
    if (input === "" || searchedArray.length===0) {
      setCommandPopperAnchor(null)
    } else {
      setCommandPopperContent(searchedArray)
    }
  }

  function Execute(target) {
    let d = new Date()
    let formDate = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
    addToConsole(formDate + " >>> " + target.value)
    let command = target.value
    if (command.includes(" ")) {command = command.splice(" ")[0]}
    //check the local functions first
    switch(command) {
      case "version":
        addToConsole("v0.0.1")
        break;
      case "test":
        props.io("console", "test", (response) => {
          addToConsole(response)
        })
        break;
      default:
        addToConsole(`The command "${target.value}" does not exist in the local or remote dictionaries. Please use the 'help' command to get a full list of commands.`)
        break;
    }
    setCommandPopperAnchor(null)
  }

  function addToConsole(text) {
    setServerConsole((prevState) => (prevState + "\n" + text))
    setTimeout(() => {
      // @ts-ignore
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }, 20)
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
              label="Peak Available Commands"
            />
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container fixed className="consoleContainer">
        <textarea ref={consoleRef} readOnly={true} className="terminalText" value={serverConsole}/>
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
              Execute(e.target)
              // @ts-ignore
              e.target.value=""
            }
          }}
          onChange={(e) => {
            //sniffCommand(e.target.value)
            sniffCommand(e)
          }}
        />
      </Container>
      <CommandPopper open={Boolean(commandPopperAnchor)} anchor={commandPopperAnchor}>
        {commandPopperContent.map((command, index) => (
          <p className="commandPopperItem"><u>{command.command}</u> : {command.description} <span className="commandPopperItemLocale">({command.locale})</span></p>
        ))}
      </CommandPopper>
    </Dialog>
  );
}