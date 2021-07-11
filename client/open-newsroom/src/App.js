import { Button, MenuItem, ThemeProvider } from '@material-ui/core';
import ConnectDialog from 'components/ConnectDialog/ConnectDialog';
import ContextMenu from 'components/ContextMenu/ContextMenu';
import MainAppbar from 'components/MainAppbar/MainAppbar';
import MainDrawer from 'components/MainDrawer/MainDrawer';
import PrefabEditor from 'components/PrefabEditor/PrefabEditor';
import MainTheme from 'components/Themes/MainTheme';
import React, { useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

function App() {
  const [ServerConnectState, setServerConnectState] = useState("");
  const [MainDrawerState, setMainDrawerState] = useState(false);
  const [DialogMenuState, setDialogMenuState] = useState({x: null, y: null});
  const [DialogMenuContents, setDialogMenuContents] = useState(null);
  const [PrefabEditorOpen, setPrefabEditorOpen] = useState(false);

  const contextHandle = (e, content) => {
    e.preventDefault();
    setDialogMenuContents(content)
    setDialogMenuState({
      x: e.clientX -2,
      y: e.clientY -4
    })
  }

  const contextHandleClose = () => {
    setDialogMenuState({x: null, y: null})
  }

  const setServerHandle = (address) => {
    setServerConnectState(address)
    const socket = io(address)
    socket.on('disconnect', () => {
      setServerConnectState("")
    })
  }

  return (
    <ThemeProvider theme={ MainTheme.c222 }>
      <ConnectDialog open={ServerConnectState!==""?false:true} onClose={setServerHandle} />
      <MainAppbar title="Open Newsroom for OBS" openDrawer={ () => setMainDrawerState(true) }>
        <Button 
          onContextMenu={(e) => contextHandle(e, [
            <MenuItem key="1" onClick={() => setPrefabEditorOpen(true)}>Fullscreen Dialog</MenuItem>,
          ])}
          variant='contained'
          color='secondary'
        >Test Stuff</Button>
      </MainAppbar>

      {/* Hidden elements go here */}
      <MainDrawer open={ MainDrawerState } onClose={ () => setMainDrawerState(false) } contextHandler={contextHandle}/>
      <ContextMenu 
        open={DialogMenuState.y !== null && DialogMenuContents !== null}
        onClose={contextHandleClose}
        contents={DialogMenuContents}
        anchorPosition={
          DialogMenuState.y !== null && DialogMenuState.x !== null
          ? { top: DialogMenuState.y, left: DialogMenuState.x } : undefined
        }
      />
      <PrefabEditor contextHandler={contextHandle} open={PrefabEditorOpen} onClose={() => setPrefabEditorOpen(false)} canvasInfo={{width: 1920, height: 1080}} />

    </ThemeProvider>
  );
}

export default App;
