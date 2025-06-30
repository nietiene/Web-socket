const express = require("express");
const socketIo = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/broad.html");
});

io.on('connection', (socket) => {
    console.log("user connected");


    socket.on('chatMessage', (msg) => {
        console.log("Received messgae", msg);

        io.emit("chatMessage", msg); 
    });

    
socket.on("disconnect", () => {
    console.log("User disconnected");
});

})
