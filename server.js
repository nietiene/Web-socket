const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/chat.html")
});

io.on('connection', (socket) => {
    console.log('User connected');


    // Sending message and retrieving messgae
    socket.on('chatMessage', (msg) => {

        console.log("Received message:", msg);

        socket.emit('chatMessage', `server received ${msg}`)
    })

    socket.on('disconnect', () => {
        console.log("User disconnected");
    });
});

server.listen(3000, () => {
    console.log("http://localhost:3000");
})