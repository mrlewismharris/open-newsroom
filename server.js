const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');

let sceneCollection = [];
let serverFirstRun = true;
let collectionName = "";

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/obs', (req, res) => {
  res.sendFile(__dirname + '/obs.html');
});

app.get('/test', (req, res) => {
  res.sendFile(__dirname + '/test.html');
});

io.on('connection', (socket) => {

  if (serverFirstRun) {
    fs.readdir('fs/collections', (err, files) => {
      io.emit('serverFirstRun', files)
    })
  }

  socket.on("clientSendScene", (data) => {
    io.emit("obsDisplay", data)
  })

  socket.on('chooseCollection', (name) => {
    collectionName = name
    reloadCollection()
  })

  function reloadCollection() {
    console.log(`Attempting to read "fs/collections/${collectionName}"`)
    if (fs.existsSync(`fs/collections/${collectionName}`)) {
      fs.readFile(`fs/collections/${collectionName}`, "utf8", (err, data) => {
        if (err) {console.log(err)}
        sceneCollection = JSON.parse(data)
        console.log("Read successful! Scene collection set")
      })
    } else {
      fs.writeFile(`fs/collections/${collectionName}`, "", (err) => {
        if (err) throw err;
        console.log('FS: Save File Updated')
      })
    }
  }

  io.emit('broadcastSceneCollection', sceneCollection);

  socket.on('addScene', (data) => {
    for (i=0;i<sceneCollection.length;i++) {
      console.log(`Checking if ${i} of sceneCollection is ${data.name}`)
      if (data.name == sceneCollection[i].name) {
        console.log(`Duplicate found! ${i} of sceneCollection was "${sceneCollection[i].name}"`)
        sceneCollection.splice(i, 1)
      }
    }
    sceneCollection.push(data)
    console.log(sceneCollection)
    io.emit('update-scene', data)
    fs.writeFile(`fs/collections/${collectionName}`, JSON.stringify(data), (err) => {
      if (err) throw err;
      console.log('FS: Save File Updated')
    })
  })

});

http.listen(3000, () => {
   console.log('listening on *:3000');
});