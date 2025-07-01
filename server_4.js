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
    console.log("User connected");

    socket.on("joinRoom", (roomName) => {
        socket.join(roomName);
        console.log(`User joined ${roomName}`);
    });

    socket.on('roomMessage', ({ room, message }) => {
        io.to(room).emit("roomMessage", message);
    })

    socket.on("disconnect", () => {
        console.log("User disocnnected");
    })
})


server.listen(3000, () => {
    console.log("http://localhost:3000");
})