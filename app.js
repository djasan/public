import express from "express";
import http from "http";
import { Server } from "socket.io";
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const app = express();
const server = http.Server(app);
const io = new Server(server);
const host = "127.0.0.1";
const port = "8000";

const firebaseConfig = {

  apiKey: "AIzaSyBz9HBd0Fp9lt-HdA3Gn_gsR-ETKQbGIi8",

  authDomain: "chatmoulette.firebaseapp.com",

  projectId: "chatmoulette",

  storageBucket: "chatmoulette.appspot.com",

  messagingSenderId: "604890728955",

  appId: "1:604890728955:web:1f3c9679b5d11b555f235e",

  measurementId: "G-FFKRTGJZHB"

};


firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();



app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

async function loadMessages() {
  try {
    const querySnapshot = await db
      .collection("messages")
      .orderBy("timestamp")
      .get();
    const messages = querySnapshot.docs.map((doc) => doc.data());
    io.emit("loadMessages", { messages });
  } catch (error) {
    console.error("Error loading messages:", error);
  }
}
loadMessages();

db.collection("messages").onSnapshot((snapshot) => {
  const messages = snapshot.docs.map((doc) => doc.data());
  io.emit("loadMessages", { messages });
});

io.on("connection", (socket) => {
  socket.username = "";

  socket.on("changeUsername", (newUsername) => {
    socket.username = newUsername;

    const connectedUsers = Array.from(io.sockets.sockets).map(
      ([_, client]) => client.username
    );
    io.emit("updateUserList", connectedUsers);
  });

  socket.on("message", async (data) => {
    if (socket.username) {
      data.timestamp = Date.now();
      data.username = socket.username;
      socket.broadcast.emit("resMessage", { data });

      try {
        await db.collection("messages").add({
          username: data.username,
          text: data.text,
          timestamp: data.timestamp,
        });
      } catch (error) {
        console.error("Error adding message to Firestore:", error);
      }
    }
  });

  const connectedUsers = Array.from(io.sockets.sockets).map(
    ([_, client]) => client.username
  );
  io.emit("updateUserList", connectedUsers);
  loadMessages();
});

function getConnectedUsernames(io) {
  const connectedSockets = io.sockets.clients().sockets;
  const connectedUsernames = Object.values(connectedSockets).map(
    (client) => client.username
  );
  return connectedUsernames;
}

db.collection("messages")
  .orderBy("timestamp")
  .onSnapshot((snapshot) => {
    const messages = snapshot.docs.map((doc) => doc.data());
    io.emit("loadMessages", { messages });
  });

server.listen(port, host, () => {
  console.log(`Server is running at http://${host}:${port}`);
});
