const express = require("express");
const http = require("http");
const session = require("express-session");
const mysql = require("mysql2");
const { Server } = require("socket.io");
const { use } = require("react");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'factorise@123',
    database:'chat-app'
})

const sessionMiddleware = session({
    secret: 'go-away',
    resave: false,
    saveUninitialized: true
});

app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

//share a session with middleware

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

const users = {};

app.get('/', (req, res) => {
    if (res.session.username) {
        res.sendFile(__dirname + "/chat.html");
    } else {
       res.sendFile(__dirname + "/login.html");
    }
});

app.post('/login', (req, res) => {
    const {username, password} = req.body;
    db.query(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        [username, password], (err, result) => {
            if (err) throw err;
        })
})