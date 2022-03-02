const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const mcping = require('mcping-js')

// set up rate limiter: maximum of five requests per minute
var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 30
});

// apply rate limiter to all requests
app.use(limiter);

// 25565 is the default Minecraft Java Edition multiplayer server port
// The port may be omitted and will default to 25565

const timeout = 5000;
const protocolVersion = 757;

function checkOnlineAndSend(io, socket_id, server_name) {
    var server = new mcping.MinecraftServer(server_name, 25565)
    server.ping(timeout, protocolVersion, (err, res) => {
        if (res) {
            io.to(socket_id).emit("update", true);
        } else {
            io.to(socket_id).emit("update", false);
        }
    })
}

app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/checker.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('update', (server_name) => {
        console.log('message: ' + server_name + " from " + socket.id);
        checkOnlineAndSend(io, socket.id, server_name)
    });
});



server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});