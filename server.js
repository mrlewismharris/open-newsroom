const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/obs', function(req, res) {
  res.sendFile(__dirname + '/obs.html');
});

io.on('connection', function(socket) {
  console.log('A user connected');
  socket.on("helloServer", () => {
    console.log("connection sent from client " + socket.id);
  })

  socket.on('disconnect', () => {
   console.log('A user disconnected');
  });
});

http.listen(3000, () => {
   console.log('listening on *:3000');
});