const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
});

io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('disconnected', () => {
        console.log("User disconnected");
    });
});

