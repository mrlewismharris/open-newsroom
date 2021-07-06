import React, { useRef, useState } from "react";
import { AppBar, Button, ClickAwayListener, Dialog, Grow, IconButton, MenuItem, MenuList, Paper, Popper, Slide, Toolbar, Typography } from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import './PrefabEditor.css';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

const Transition = React.forwardRef(function Transition(props, ref) {
  // @ts-ignore
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function PrefabEditor(props) {
  const anchorRef = useRef(null)
  const [contextOpen, setContextOpen] = useState(false)

  return (
    <div>
      <Dialog
        fullScreen
        className="PrefabEditor"
        open={props.open}
        onClose={props.onClose}
        // @ts-ignore
        TransitionComponent={Transition}
      >
        <AppBar className="prefabEditorAppbar">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={props.onClose} aria-label="close">
                <CloseIcon />
            </IconButton>
            <Typography className="AppbarTitle" variant="h6">Prefab Editor</Typography>
            <Typography className="AppbarButton">Prefab Name</Typography>
            <Button
              ref={anchorRef}
              variant="contained"
              color="secondary"
              className="AppbarButton"
              endIcon={<ArrowDropDownIcon/>}
              onClick={() => setContextOpen(true)}
            >Edit</Button>
            <Popper open={contextOpen} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={() => setContextOpen(false)}>
                      <MenuList autoFocusItem={contextOpen} id="menu-list-grow">
                        <MenuItem onClick={() => setContextOpen(false)}>New</MenuItem>
                        <MenuItem onClick={() => setContextOpen(false)}>Open</MenuItem>
                        <MenuItem onClick={() => setContextOpen(false)}>Duplicate</MenuItem>
                        <MenuItem onClick={() => setContextOpen(false)}>Move to Bin</MenuItem>
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
            <Button 
              variant='contained'
              color='secondary'
            >Save</Button>
          </Toolbar>
        </AppBar>
        {/*  Dialog elements go here  */}
      </Dialog>
    </div>
  );
}