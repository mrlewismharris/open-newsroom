import React from 'react';
import { AppBar, Toolbar, IconButton, Typography } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu'
import { makeStyles } from '@material-ui/core/styles';
import './MainAppbar.css';

const useStyles = makeStyles((theme) => ({
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

export default function MainAppbar(props) {
  const classes = useStyles(); 

  return (
    <AppBar position="static" className="AppbarLightShadow">
      <Toolbar>
        <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu" onClick={ props.openDrawer }>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          { props.title }
        </Typography>
          { props.children }
      </Toolbar>
    </AppBar>
  )
  
}