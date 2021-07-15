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
    `Start typing with "!" to see available commands`
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
          inputRef={inputRef}
          autoFocus
          className="consoleInputText"
          fullWidth
          margin="normal"
        />
      </Container>
    </Dialog>
  );
}