const { Socket } = require("dgram");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/room.html");
});

io.on('connection', (socket) => {
    
})