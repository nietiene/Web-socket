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
    password: 'factorise@123',
    database: 'chat_app'
});

const sessionMiddleware = session({
    secret: 'go-away',
    resave: false,
    saveUninitialized: true
});