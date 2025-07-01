const express = require("express");
const http = require("http");
const session = require("express-session");
const mysql = require("mysql2");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'factorise@123',
    database:'chat_app'
})

const sessionMiddleware = session({
    secret: 'go-away',
    resave: false,
    saveUninitialized: true
});

app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

//share a session with middleware
// use socket and requests in our socket
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

const users = {};

app.get('/userList', (req, res) => {
   if (!req.session.username) return res.status(401).json([]);

   db.query(
          "SELECT * FROM users WHERE username != ?", 
           [req.session.username], (err, result) => {
            if (err) throw err;

            res.json(result);
           })
})
app.get('/', (req, res) => {
    if (req.session.username) {
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

            if (result.length > 0) {
                req.session.username = username;
                return res.redirect('/');
            } else {
                return res.send("Invalid credentials");
            }
        })
});


io.on("connection", (socket) => {

    const session = socket.request.session;
    if (!session || !session.username)  return socket.disconnect();

    const username = session.username;
    users[username] = socket.id;

    console.log(`${username} Connected`);

    socket.on("privateMessage", ({ to, message }) => {
        const toSocketId = users[to];
        if (toSocketId) {
            io.to(toSocketId).emit("privateMessage", {
                from:  username,
                message
            });
        }
    })


    socket.on("disconnect", () => {
        delete users[username];
        console.log(`${username} disconnected`);
    })
})

app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log("Logout error:", err);
            return res.send("Error logging out");
        }

        res.redirect("/"); // redirect to login page
    });
});
server.listen(4000, () => {
    console.log("http://localhost:4000");
});