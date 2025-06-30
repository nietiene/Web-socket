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


    socket.on('chatMessage', (data) => {
        console.log(`${data.username} says ${data.message}`);

        io.emit("chatMessage", {
            username: data.username,
            message: data.message
        });  // broadcast to every connected user 
    });

    
socket.on("disconnect", () => {
    console.log("User disconnected");
});

})


server.listen(3000, () => {
    console.log("http://localhost:3000");
})