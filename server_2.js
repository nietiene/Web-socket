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

        io.emit("chatMessage", msg);  // broadcast to every connected user 
    });

    
socket.on("disconnect", () => {
    console.log("User disconnected");
});

})


server.listen(3000, () => {
    console.log("http://localhost:3000");
})