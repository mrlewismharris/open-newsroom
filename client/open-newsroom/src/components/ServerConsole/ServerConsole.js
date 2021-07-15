import { AppBar, Button, Container, Dialog, FormControl, IconButton, Input, InputAdornment, Slide, TextField, Toolbar, Typography } from "@material-ui/core";
import React, { useRef, useState } from "react";
import CloseIcon from '@material-ui/icons/Close';
import './ServerConsole.css'

const Transition = React.forwardRef(function Transition(props, ref) {
  // @ts-ignore
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ServerConsole(props) {

  const inputRef = useRef();

  const initialConsole = [
    `Open Newsroom Server Console v0.0.1`,
    ` `,
    `This console allows for text-based messages to be`,
    `transmitted and recieved from the Open Newsroom server.`,
    ` `,
    `This could be helpful for debugging purposes, but also`,
    `for custom batch commands to be sent to the server, as`,
    `well as custom commands to be added to the project code.`
  ]
  const [contents, setContents] = useState(initialConsole)

  function closeConsole() {
    setContents(initialConsole)
    props.onClose()
  }

  return (
    <Dialog
      onClick={() => {
        // @ts-ignore
        inputRef.current.children[0].children[0].focus()
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
          <Button
            //ref={anchorRef_File}
            variant="contained"
            color="secondary"
            className="AppbarButton"
            onClick={() => {console.log("button clicked")}}
          >Documentation</Button>
        </Toolbar>
      </AppBar>

      <Container
        fixed
        className="consoleContainer"
      >
        {contents.map((item) => {
          return(
            <p className="terminalText">{item}</p>
          )
        })}
      </Container>
      <Container
        fixed
        className="consoleInput"
      >
        <TextField
          ref={inputRef}
          autoFocus
          className="consoleInputText"
          fullWidth
          margin="normal"
        />
      </Container>
    </Dialog>
  );
}