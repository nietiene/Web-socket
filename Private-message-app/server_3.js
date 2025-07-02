const express = require("express");
const http = require("http");
const session = require("express-session");
const mysql = require("mysql2");
const { Server } = require("socket.io");
const path = require("path");
const { Socket } = require("dgram");

const app = express();
const server = http.createServer(app);
const io = new Server(server);


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chat_app'
});

const sessionMiddleware = session({
    secret: 'go-away',
    resave: false,
    saveUninitialized: true
});

app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(express.static(__dirname));

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

const user = {};

function broadCastOnlineUser() {
    db.query(
        `SELECT username FROM users`, (err, result) => {
            const userList = result.map(u => ({
                username: u.username,
                online: !user[u.userList]
            }))
            io.emit("updateOnlineUser", userList);
        })
}

app.get('/', (req, res) => {
    if (req.session.username) {
        res.sendFile(__dirname, "/chat.html");
    } else {
        res.sendFile(__dirname + "/login.html");
    }
})

app.post("/login", (req, res) => {
       const { username, password } = req.body;

       db.query(
        `SELECT * FROM users WHERE username = ? AND password = ?`,
        [username, password],
        (err, result) => {
            if (err) throw err;
            if (result.length > 0) {
                req.session.username = username;
                res.redirect("/");
            } else {
                res.send("Invalid credentials");
            }
        }
       )
})

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
          if (err) throw err;
          res.redirect("/");
    });
});


app.get("/messages/:withUser", (req, res) => {
    const from = req.session.username;
    const to = req.session.withUser;

    db.query(
        `UPDATE message SET is_read = true WHERE receiver = ? AND sender = ?`,
         [from, to]
    );

    db.query(
        `SELECT * FROM messages WHERE (sender = ?  AND receiver = ? ) OR (sender = ? AND receiver = ?) ORDER BY timestamp ASC`,
        (err, result) => {
            if (err)  throw err;
            res.json(result);
     }
    )
})

app.get('/whoami', (req, res) => {
    if (!req.session.username) return res.status(400).json({username: null});
    res.json({ username: req.session.username});
});

io.on("connection", (socket) => {
    const session = socket.request.session;
    if (!session || !session.username) return socket.disconnect();

    const username = session.username;
    user[username] = socket.id;
    console.log(`${username} connected`);  
    broadCastOnlineUser();

    socket.on("privateMessage", ({ to, message }) => {
        const toSocketId = user[to];
        db.query(
            `INSERT INTO messages (sender, receiver, message) VALUES(?,?,?)`,
            [username, to]
        )
    })
})