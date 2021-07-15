import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Divider, Drawer } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { makeStyles } from '@material-ui/core/styles';
import TextsmsIcon from '@material-ui/icons/Textsms';
import './MainDrawer.css'

const useStyles = makeStyles({
  list: {
    width: 300,
  },
  paper: {
    background: '#222',
    color: '#fff'
  }
});

export default function MainDrawer(props) {

  const classes = useStyles();

  return (
    <Drawer anchor="left" classes={{ paper: classes.paper }} open={ props.open } onClose={ props.onClose }>
      <div
        className={classes.list}
        role="presentation"
        onClick= { props.onClose }
      >
        <List>
          <ListItem className="drawerButton" button key="1" onClick={props.prefabEditor}>
            <ListItemIcon>
              <EditIcon style={{fill: '#ddd'}} />
            </ListItemIcon>
            <ListItemText primary="Prefab Editor" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem className="drawerButton" button key="2" onClick={ props.serverConsole }>
            <ListItemIcon>
              <TextsmsIcon style={{fill: '#ddd'}} />
            </ListItemIcon>
            <ListItemText primary="Open Server Console"/>
          </ListItem>
        </List>
      </div>
    </Drawer>
  )
}