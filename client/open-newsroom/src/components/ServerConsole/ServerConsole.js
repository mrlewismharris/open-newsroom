import { AppBar, Checkbox, Container, createMuiTheme, Dialog, FormControlLabel, IconButton, Slide, TextField, ThemeProvider, Toolbar, Tooltip, Typography } from "@material-ui/core";
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
  const [commandHistoryList, setCommandHistoryList] = useState([""])
  const [commandHistoryIndex, setCommandHistoryIndex] = useState(0)

  //command popper states
  const [commandPopperAnchor, setCommandPopperAnchor] = useState(null)
  const [commandPopperContent, setCommandPopperContent] = useState([])
  
  const [fetchedRemote, setFetchedRemote] = useState(false)
  const [typedMatchedCommand, setTypedMatchedCommand] = useState([])
  const [typedMatchedCommandIndex, setTypedMatchedCommandIndex] = useState(0)
  const [dictionary, setDictionary] = useState([])
  let localDictionary = [
    {command: "client_version", description: "Returns Open Newsroom version(s)", locale: "local",
      args: "None"},
    {command: "client_help", description: "Display all the available commands from the client dictionary", locale: "local",
      args: "None"},
    {command: "clear", description: "Clear the console", locale: "local",
        args: "None"},
  ]

  function commandHistoryHandlerUp() {
    if (commandHistoryList.length === 0) {
      return ""
    } else {
      if (commandHistoryIndex === 0) {
        setCommandHistoryIndex(commandHistoryList.length-1)
      } else {
        setCommandHistoryIndex(commandHistoryIndex-1)
      }
      return commandHistoryList[commandHistoryIndex]
    }
  }

  const themeWhite = createMuiTheme({
    palette: {
      primary: {
        main: '#777'
      },
      text: {
        primary: '#fff'
      }
    }
  })

  function commandHistoryHandlerDown() {
    if (commandHistoryList.length === 0) {
      return ""
    } else {
      if (commandHistoryIndex+1 === commandHistoryList.length) {
        setCommandHistoryIndex(0)
      } else {
        setCommandHistoryIndex(commandHistoryIndex+1)
      }
      return commandHistoryList[commandHistoryIndex]
    }
  }

  function completeFunctionName() {
    if (typedMatchedCommand.length === 0 || typedMatchedCommand.length === dictionary.length) {
      return false
    } else {
      let selectedCommand = typedMatchedCommand[typedMatchedCommand.length-1-typedMatchedCommandIndex].command
      if (typedMatchedCommandIndex === typedMatchedCommand.length-1) {
        setTypedMatchedCommandIndex(0)
      } else {
        setTypedMatchedCommandIndex(typedMatchedCommandIndex+1)
      }
      return selectedCommand
    }
  }

  function closeConsole() {
    setServerConsole(initialConsole)
    props.onClose()
  }

  function getRemoteDictionary() {
    if (!fetchedRemote) {
      props.io("getServerDictionary", null, response => {
        setDictionary(localDictionary.concat(response))
      })
      setFetchedRemote(true)
    }
    return true
  }

  function sniffCommand(event) {
    setTypedMatchedCommandIndex(0)
    getRemoteDictionary()
    if (!previewCommands) return
    let input = event.target.value
    if (input.includes(" ")) {input = input.split(" ")[0]}
    let searchedArray = []
    dictionary.forEach(item => {
      if (item.command.indexOf(`${input}`)===0) {
        searchedArray.unshift(item)
        setTypedMatchedCommand(searchedArray)
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
    if (target.value) {
      let originalCommand = target.value
      let command = target.value
      //add the command to the history
      setCommandHistoryList(list => [...list, command])
      setTimeout(() => {
        //set the index of commandHistory to -1
        setCommandHistoryIndex(commandHistoryList.length)
        if (command.includes(" ")) {command = command.split(" ")[0]}
        //check the local functions first
        switch(command) {
          case "clear":
            clearConsole()
            break;
          case "client_help":
            addToConsole(localDictionary.map(command => `${command.command} : ${command.description} (${command.locale}) - Args: ${command.args}`).join('\n'))
            break;
          case "client_version":
            addToConsole("v0.0.1")
            break;
          default:
            props.io("console", originalCommand, (response) => {
              addToConsole(response)
            })
            break;
        }
      }, 0)
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

  function clearConsole() {
    setServerConsole("")
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
        <ThemeProvider theme={themeWhite}>
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
                e.target.value = ""
              } else if (e.code === "ArrowUp") {
                // @ts-ignore
                e.target.value = commandHistoryHandlerUp()
                setTimeout(() => {
                  // @ts-ignore
                  e.target.selectionStart = e.target.value.length
                }, 0)
              } else if (e.code === "ArrowDown") {
                // @ts-ignore
                e.target.value = commandHistoryHandlerDown()
              } else if (e.code === "Tab") {
                e.preventDefault()
                if (completeFunctionName()) {
                  // @ts-ignore
                  e.target.value = completeFunctionName()
                }
              }
            }}
            onChange={(e) => {
              setCommandHistoryIndex(-1)
              //sniffCommand(e.target.value)
              sniffCommand(e)
            }}
          />
        </ThemeProvider>
      </Container>
      <CommandPopper open={Boolean(commandPopperAnchor)} anchor={commandPopperAnchor}>
        {commandPopperContent.map((command, index) => (
          <p className="commandPopperItem"><b>{command.command}</b> : {command.description} <span className="commandPopperItemLocale">({command.locale})</span><br/><span className="commandPopperItemArgs">Args: {command.args}</span></p>
        ))}
      </CommandPopper>
    </Dialog>
  );
}