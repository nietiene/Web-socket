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
        const targetSocketId = users[to]; // find targeted socket id where his username is to(ex bob);
        if (targetSocketId) {
            io.to(targetSocketId).emit("privateMessage", { // sends messsage to that Id
                from, message
            });
        } else { // when socket id does not online we send message back to user directly
            socket.emit("privateMessage", {
                from: "system",
                message: `${to} is not online.`
            })
        }
    });

    socket.on('disconnect', () => {
      
        for (let username in users) {
            if (users[username] === socket.id) { // indicates which user is disconnected
                delete users[username]; // remove user from our object
                console.log(`User ${username} disconnected`);
            }
        }
    }) 
})


server.listen(3001, () => {
    console.log(`http://localhost:3001`);
})