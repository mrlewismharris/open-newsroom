import React, { useRef, useState } from "react";
import { AppBar, Button, ClickAwayListener, Dialog, Drawer, Grow, IconButton, List, ListItem, ListItemIcon, ListItemText, MenuItem, MenuList, Paper, Popper, Slide, Toolbar, Tooltip, Typography } from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import './PrefabEditor.css';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import NewPrefabDialog from "./NewPrefabDialog";
import Canvas from "./Canvas";
import CenterFocusStrongIcon from '@material-ui/icons/CenterFocusStrong';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import ZoomOutIcon from '@material-ui/icons/ZoomOut';

const Transition = React.forwardRef(function Transition(props, ref) {
  // @ts-ignore
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function PrefabEditor(props) {
  const anchorRef_File = useRef(null)
  const anchorRef_Edit = useRef(null)

  const [prefabOpen, setPrefabOpen] = useState(false)

  const [fileContextOpen, setFileContextOpen] = useState(false)
  const [editContextOpen, setEditContextOpen] = useState(false)
  const [newPrefabDialog, setNewPrefabDialog] = useState(false)

  const [thisPrefabName, setThisPrefabName] = useState("")
  const [editorCanvasInfo, setEditorCanvasInfo] = useState({width: 0, height: 0})
  const [refreshCanvasCentre, doRefreshCanvasCentre] = useState(0)
  const [canvasZoom, setCanvasZoom] = useState(0.4)

  function createNewPrefab(newName, newWidth, newHeight) {
    setPrefabOpen(true)
    setThisPrefabName(newName)
    setEditorCanvasInfo({width: newWidth, height: newHeight})
    doRefreshCanvasCentre(refreshCanvasCentre+1)
  }

  function closePrefabEditor() {
    setPrefabOpen(false)
    setThisPrefabName("")
    setEditorCanvasInfo({width: 0, height: 0})
    props.onClose()
  }

  return (
    <div>
      <Dialog
        fullScreen
        className="PrefabEditor"
        open={props.open}
        onClose={closePrefabEditor}
        // @ts-ignore
        TransitionComponent={Transition}
      >

        <Drawer
          variant="persistent"
          open={prefabOpen}
          className="toolbarDrawer"
        >
          <List className="toolbarList">
            <Tooltip title="Add elements to prefab" style={{fontSize: 24}}>
              <ListItem button key="Add">
                <ListItemIcon>
                  <AddIcon style={{fill: "#ddd"}} /> 
                </ListItemIcon>
                <ListItemText />
              </ListItem>
            </Tooltip>
            <Tooltip title="Centre the canvas">
              <ListItem button key="Center" onClick={() => {doRefreshCanvasCentre(refreshCanvasCentre+1)}}>
                <ListItemIcon>
                  <CenterFocusStrongIcon style={{fill: "#ddd"}} /> 
                </ListItemIcon>
                <ListItemText />
              </ListItem>
            </Tooltip>
            <Tooltip title="Zoom in (+5%)">
              <ListItem button key="ZoomIn" onClick={() => {setCanvasZoom(canvasZoom+0.05)}}>
                <ListItemIcon>
                  <ZoomInIcon style={{fill: "#ddd"}} /> 
                </ListItemIcon>
                <ListItemText />
              </ListItem>
            </Tooltip>
            <Tooltip title="Zoom out (-5%)">
              <ListItem button key="ZoomOut" onClick={() => {setCanvasZoom(canvasZoom-0.05)}}>
                <ListItemIcon>
                  <ZoomOutIcon style={{fill: "#ddd"}} /> 
                </ListItemIcon>
                <ListItemText />
              </ListItem>
            </Tooltip>
          </List>
        </Drawer>


        <AppBar className="prefabEditorAppbar">
          <Toolbar>
            <IconButton className="AppbarExit" edge="start" color="inherit" onClick={closePrefabEditor} aria-label="close">
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
        <Canvas
          open={prefabOpen}
          canvasInfo={editorCanvasInfo}
          recentre={refreshCanvasCentre}
          zoom={canvasZoom}
        />

      </Dialog>
    </div>
  );
}