import React from "react";
import { AppBar, Button, Dialog, IconButton, Toolbar, Typography } from "@material-ui/core";
import './PrefabEditor.css';
import CloseIcon from '@material-ui/icons/Close';



export default function PrefabEditor(props) {

  return (
    <div>
      <Dialog fullScreen open={props.open} onClose={props.onClose}>
        <AppBar className="prefabEditorAppbar">
          <Toolbar>
            <IconButton edge="start" color="primary" onClick={props.onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6">
              Sound
            </Typography>
            <Button autoFocus color="inherit" onClick={props.onClose}>
              save
            </Button>
          </Toolbar>
        </AppBar>
        {/*  Dialog elements go here  */}
      </Dialog>
    </div>
  );
}