const express = require("express");
const http = require("http");
const session = require("express-session");
const mysql = require("mysql2");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chat_app',
});

db.connect((err) => {
    if (err) console.log("err", err);
    console.log("Connected");
})
const sessionMiddleware = session({
    secret: 'go-away',
    resave: false,
    saveUninitialized: true
});

app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(express.static(__dirname));

// integrating session to socket app
io.use((socket, next) => {
    // socket: individual socket connection
    sessionMiddleware(socket.request, {}, next);
});

const users = {};

function broadCastOnlineUser() {
    db.query(
        `SELECT username FROM users`, (err, result) => {
            if (err) console.error(err);

            const userList = result.map(u => ({
                username: u.username,
                online: !!users[u.username] && users[u.username].length > 0
            }))
            io.emit("updateOnlineUser", userList);
        })
     console.log("Currently online users:", Object.keys(users));

}

app.get('/', (req, res) => {
    if (req.session.username) {
        res.sendFile(path.join(__dirname, "/chat_3.html"));
    } else {
        res.sendFile(path.join(__dirname + "/login.html"));
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
    const to = req.params.withUser;

    db.query(
        `UPDATE messages SET is_read = true WHERE receiver = ? AND sender = ?`,
         [from, to]
    );

    db.query(
        `SELECT * FROM messages WHERE (sender = ?  AND receiver = ? ) OR (sender = ? AND receiver = ?) ORDER BY timestamp ASC`,
        [from, to, to, from],(err, result) => {
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
    users[username] = socket.id;
    console.log(`${username} connected`);  
    broadCastOnlineUser();

    socket.on("privateMessage", ({ to, message }) => {
        const toSocketId = users[to];
        db.query(
            `INSERT INTO messages (sender, receiver, message) VALUES(?,?,?)`,
            [username, to, message],
            (err) => {
                if (err) console.log("DB Error", err);
            }
        );

        if (toSocketId) {
            io.to(toSocketId).emit("privateMessage", {
                from: username,
                message
            });
        }

    })

    socket.on("typing", ({ to }) => {
        const toSocketId = users[to];
        if (toSocketId) io.to(toSocketId).emit("typing", username);

    })

    socket.on("stopTyping", ({ to }) => {
        const toSocketId = users[to];
        if (toSocketId) io.to(toSocketId).emit("stopTyping");
    });

    socket.on("disconnect", () => {
        delete users[username];
        broadCastOnlineUser();
        console.log(`${username} disconnected`);
    })
});

server.listen(4005, () => {
    console.log("http://localhost:4005");
})