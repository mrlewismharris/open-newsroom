import { Popper, Paper } from '@material-ui/core';
import React from 'react';
import './ServerConsole.css';

export default function CommandPopper(props) {


  return (
    <Popper
      open={props.open}
      anchorEl={props.anchor}
      placement="bottom-start"
      className="commandPopper"
    >
      <Paper>
        {props.children}
      </Paper>
    </Popper>
  )
}