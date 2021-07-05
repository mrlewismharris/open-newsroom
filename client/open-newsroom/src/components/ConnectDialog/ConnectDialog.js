import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField, CircularProgress } from "@material-ui/core";
import WifiIcon from '@material-ui/icons/Wifi';
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function ConnectDialog(props) {

  const [address, setAddress] = useState("http://localhost:3001")
  const [connectIcon, setConnectIcon] = useState(<WifiIcon/>)

  const connectHandle = () => {
    setConnectIcon(<CircularProgress disableShrink style={{color: '#00C853'}} size={20} thickness={7} />)

    //start again here!
    const socket = io(address)

    if (false) {
      props.onClose(address)
    } else {
      setTimeout(() => {
        setConnectIcon(<WifiIcon/>)
      }, 500)
    }
  }

  useEffect(() => {
    //connectHandle()
  })

  return (
    <Dialog 
      open={props.open}
      aria-labelledby="serverConnectDialogTitle"
      aria-describedby="serverConnectDialogDescription"
    >
      <DialogTitle id="serverConnectDialogTitle">Connect to Server</DialogTitle>
      <DialogContent>
        <DialogContentText id="serverConnectDialogDescription">
          <form noValidate autoComplete="off">
            <TextField required id="standard-required" label="Server Address" defaultValue="http://localhost:3001" onChange={(e) => setAddress(e.target.value)} size="medium" autoFocus/>
          </form>
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