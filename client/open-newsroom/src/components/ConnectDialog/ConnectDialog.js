import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField, CircularProgress, FormControl } from "@material-ui/core";
import WifiIcon from '@material-ui/icons/Wifi';
import React, { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import './ConnectDialog.css'

export default function ConnectDialog(props) {

  const [address, setAddress] = useState("http://localhost:3001")
  const [connectIcon, setConnectIcon] = useState(<WifiIcon/>)
  const [connectionError, setConnectionError] = useState(false)

  const connectHandle = useCallback(() => {
    setConnectIcon(<CircularProgress disableShrink style={{color: '#00C853'}} size={20} thickness={7} />)
    setConnectionError(false)
    if (address === "") {
      setConnectionError(true)
      return null
    }

    const socket = io(address, {
      reconnection: false,
      timeout: 1500
    })

    socket.on("connect", () => {
      localStorage.setItem("lastSuccessfulAddress", address)
      props.onClose(address)
    });

    socket.io.on("error", () => {
      setConnectIcon(<WifiIcon/>)
      setConnectionError(true)
    });
  }, [props, address])

  useEffect(() => {
    if (localStorage.getItem("lastSuccessfulAddress") === null) {
      localStorage.setItem("lastSuccessfulAddress", "")
    }
  
    if (localStorage.getItem("lastSuccessfulAddress") !== "") {
      setAddress(localStorage.getItem("lastSuccessfulAddress"))
    }

    connectHandle()
  }, [connectHandle])

  return (
    <Dialog 
      open={props.open}
      aria-labelledby="serverConnectDialogTitle"
      aria-describedby="serverConnectDialogDescription"
    >
      <DialogTitle id="serverConnectDialogTitle">Connect to Server</DialogTitle>
      <DialogContent>
        <DialogContentText id="serverConnectDialogDescription">
          <FormControl>
            <TextField required 
              id="standard-required" 
              label="Server Address" 
              defaultValue={address}
              onClick={() => setConnectionError(false)}
              onChange={(e) => {
                setConnectionError(false)
                setAddress(e.target.value)
              }}
              size="medium"
              error={connectionError}
              helperText={connectionError?"Connection Error":""}
              className="serverAddressField"
              autoFocus
            />
          </FormControl>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={connectHandle} variant="contained" color="primary" startIcon={connectIcon}>
          Connect
        </Button>
      </DialogActions>
    </Dialog>
  );
}
