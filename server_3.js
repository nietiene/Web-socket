const express = require("express");
const socketIo = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/private.html");
});

const users = {};

io.on('connection', (socket) => {
    console.log("User connected", socket.id);


    socket.on('register', (username) => {
        users[username] = socket.id;
        console.log(`Register user: ${username} (socket: ${socket.id})`);
    })

    socket.on("privateMessage", ({to, from, message}) => {
        const targetSocketId = users[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit("privateMessage", {
                from, message
            });
        } else {
            socket.emit("privateMessage", {
                from: "system",
                message: `${to} is not online.`
            })
        }
    });

    socket.on('disconnect')
})