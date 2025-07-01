const express = require("express");
const http = require("http");
const session = require("express-session");
const mysql = require("mysql2");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'factorise@123',
    database: 'chat_app'
});

// Session setup
const sessionMiddleware = session({
    secret: 'go-away',
    resave: false,
    saveUninitialized: true
});
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(express.static(__dirname)); // serve HTML files

// Share session with Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

const users = {};

// Routes
app.get('/', (req, res) => {
    if (req.session.username) {
        res.sendFile(path.join(__dirname, 'chat_2.html'));
    } else {
        res.sendFile(path.join(__dirname, 'login.html'));
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        [username, password],
        (err, result) => {
            if (err) throw err;
            if (result.length > 0) {
                req.session.username = username;
                res.redirect('/');
            } else {
                res.send("Invalid credentials");
            }
        }
    );
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.send("Error logging out");
        res.redirect('/');
    });
});

app.get('/userList', (req, res) => {
    if (!req.session.username) return res.status(401).json([]);
    db.query(
        "SELECT username FROM users WHERE username != ?",
        [req.session.username],
        (err, result) => {
            if (err) throw err;
            res.json(result);
        }
    );
});

app.get("/messages/:withUser", (req, res) => {
    const from = req.session.username;
    const to = req.params.withUser;
    if (!from) return res.status(401).send("Not logged in");
    db.query(
        `SELECT * FROM messages 
         WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
         ORDER BY timestamp ASC`,
        [from, to, to, from],
        (err, results) => {
            if (err) return res.status(500).send("DB error");
            res.json(results);
        }
    );
});

app.get("/whoami", (req, res) => {
    if (!req.session.username) return res.status(401).json({ username: null });
    res.json({ username: req.session.username });
});

// Socket.IO
io.on("connection", (socket) => {
    const session = socket.request.session;
    if (!session || !session.username) return socket.disconnect();

    const username = session.username;
    users[username] = socket.id;
    console.log(`${username} connected`);

    socket.on("privateMessage", ({ to, message }) => {
        const toSocketId = users[to];

        // Save message to DB
        db.query(
            "INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)",
            [username, to, message],
            (err) => {
                if (err) console.error("DB error:", err);
            }
        );

        // Send to receiver if online
        if (toSocketId) {
            io.to(toSocketId).emit("privateMessage", {
                from: username,
                message
            });
        }
    });

    socket.on("disconnect", () => {
        delete users[username];
        console.log(`${username} disconnected`);
    });
});

server.listen(4001, () => {
    console.log("Server running on http://localhost:4001");
});
