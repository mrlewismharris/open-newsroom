import { Menu } from "@material-ui/core";
import React from "react";

export default function ContextMenu(props) {

  return (
    <Menu
      keepMounted
      open={props.open}
      onClose={props.onClose}
      anchorReference="anchorPosition"
      anchorPosition={props.anchorPosition}
    >
      {props.contents}
    </Menu>
  );
}