import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Divider, Drawer } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { makeStyles } from '@material-ui/core/styles';
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
          <ListItem className="drawerButton" button key="Dummy Button">
            <ListItemIcon>
              <HomeIcon style={{fill: '#ddd'}} />
            </ListItemIcon>
            <ListItemText primary="Dummy Button" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem className="drawerButton" button key="Open Dialog" onClick={ props.openDialog }>
            <ListItemIcon>
              <OpenInNewIcon style={{fill: '#ddd'}} />
            </ListItemIcon>
            <ListItemText primary="Open Dialog"/>
          </ListItem>
        </List>
      </div>
    </Drawer>
  )
}