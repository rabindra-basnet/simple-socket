import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

const users = {};           // { username: { password, token } }
const tokens = new Map();   // token -> username

// Simple login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  // Generate or validate user
  if (!users[username]) {
    users[username] = { password };
  } else if (users[username].password !== password) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // Generate a fake token (you can use real JWT in prod)
  const token = crypto.randomBytes(24).toString('hex');
  users[username].token = token;
  tokens.set(token, username);

  return res.json({ token });
});

// Registration endpoint
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  if (users[username]) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  // Save user in memory
  users[username] = { password };

  return res.status(201).json({ message: 'User registered successfully' });
});

// Socket.IO with auth
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const username = tokens.get(token);
  if (!username) {
    return next(new Error("Unauthorized: Invalid token"));
  }

  socket.username = username;
  next();
});

io.on('connection', (socket) => {
  console.log(`🔐 ${socket.username} connected with socket ID ${socket.id}`);

  socket.on("JOIN_ROOM", (roomName) => {
    socket.join(roomName);
    console.log(`${socket.username} joined room: ${roomName}`);
  });

  socket.on("SEND_MESSAGE", ({ room, message }) => {
    console.log(`💬 ${socket.username} to [${room}]: ${message}`);
    io.to(room).emit("RECEIVE_MESSAGE", {
      username: socket.username,
      message,
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ ${socket.username} disconnected`);
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
