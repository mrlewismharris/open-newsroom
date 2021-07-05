import { Button, MenuItem, ThemeProvider } from '@material-ui/core';
import ConnectDialog from 'components/ConnectDialog/ConnectDialog';
import ContextMenu from 'components/ContextMenu/ContextMenu';
import MainAppbar from 'components/MainAppbar/MainAppbar';
import MainDrawer from 'components/MainDrawer/MainDrawer';
import MainTheme from 'components/Themes/MainTheme';
import React, { useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

function App() {
  const [ServerConnectState, setServerConnectState] = useState("");
  const [MainDrawerState, setMainDrawerState] = useState(false);
  const [DialogMenuState, setDialogMenuState] = useState({x: null, y: null});
  const [DialogMenuContents, setDialogMenuContents] = useState(null);

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
            <MenuItem key="1" onClick={contextHandleClose}>Appbar</MenuItem>,
            <MenuItem key="2" onClick={contextHandleClose}>Appbar</MenuItem>,
          ])}
          variant='contained'
          color='secondary'
        >Login</Button>
      </MainAppbar>

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

    </ThemeProvider>
  );
}

export default App;
