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
    password: 'factorise@123',
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

