import React, { useRef, useState } from "react";
import { AppBar, Button, ClickAwayListener, Dialog, Drawer, Grow, IconButton, List, ListItem, ListItemIcon, ListItemText, MenuItem, MenuList, Paper, Popper, Slide, Toolbar, Typography } from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import './PrefabEditor.css';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import NewPrefabDialog from "./NewPrefabDialog";

const Transition = React.forwardRef(function Transition(props, ref) {
  // @ts-ignore
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function PrefabEditor(props) {
  const anchorRef_File = useRef(null)
  const anchorRef_Edit = useRef(null)
  const [fileContextOpen, setFileContextOpen] = useState(false)
  const [editContextOpen, setEditContextOpen] = useState(false)
  const [newPrefabDialog, setNewPrefabDialog] = useState(false)

  const [thisPrefabName, setThisPrefabName] = useState("")
  const [editorCanvasInfo, setEditorCanvasInfo] = useState({width: 0, height: 0})

  function createNewPrefab(newName, newWidth, newHeight) {
    setThisPrefabName(newName)
    console.log(`New Prefab created: "${newName}"`, newWidth, newHeight)
  }

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

        <Drawer
          variant="permanent"
          open={true}
          className="toolbarDrawer"
        >
          <List className="toolbarList">
            <ListItem button key="Add">
              <ListItemIcon>
                <AddIcon style={{fill: "#ddd"}} /> 
              </ListItemIcon>
              <ListItemText />
            </ListItem>
          </List>
        </Drawer>


        <AppBar className="prefabEditorAppbar">
          <Toolbar>
            <IconButton className="AppbarExit" edge="start" color="inherit" onClick={props.onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography className="AppbarTitle" variant="h6">Prefab Editor</Typography>
            <Typography className="AppbarButton">{thisPrefabName}</Typography>
            <Button
              ref={anchorRef_File}
              variant="contained"
              color="secondary"
              className="AppbarButton"
              endIcon={<ArrowDropDownIcon/>}
              onClick={() => setFileContextOpen(true)}
            >File</Button>
            <Popper open={fileContextOpen} anchorEl={anchorRef_File.current} role={undefined} transition disablePortal>
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={() => setFileContextOpen(false)}>
                      <MenuList autoFocusItem={fileContextOpen} id="menu-list-grow">
                        <MenuItem onClick={() => {setFileContextOpen(false);setNewPrefabDialog(true)}}>New</MenuItem>
                        <MenuItem onClick={() => setFileContextOpen(false)}>Open</MenuItem>
                        <MenuItem onClick={() => setFileContextOpen(false)}>Duplicate</MenuItem>
                        <MenuItem onClick={() => setFileContextOpen(false)}>Move to Bin</MenuItem>
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>

            <Button
              ref={anchorRef_Edit}
              variant="contained"
              color="secondary"
              className="AppbarButton"
              endIcon={<ArrowDropDownIcon/>}
              onClick={() => setEditContextOpen(true)}
            >Edit</Button>
            <Popper open={editContextOpen} anchorEl={anchorRef_Edit.current} role={undefined} transition disablePortal>
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={() => setEditContextOpen(false)}>
                      <MenuList autoFocusItem={editContextOpen} id="menu-list-grow">
                        <MenuItem onClick={() => setEditContextOpen(false)}>Change Size</MenuItem>
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>

            <Button 
              variant='contained'
              color='secondary'
            >Add to Timeline</Button>
          </Toolbar>
        </AppBar>

        <NewPrefabDialog open={newPrefabDialog} placeholderHeight={props.canvasInfo.height} placeholderWidth={props.canvasInfo.width} onClose={() => setNewPrefabDialog(false)} setCanvasInfo={setEditorCanvasInfo} newPrefab={createNewPrefab} />

        {/*  Dialog elements go here  */}
      </Dialog>
    </div>
  );
}