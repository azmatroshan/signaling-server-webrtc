const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

const IO = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

IO.use((socket, next) => {
  if (socket.handshake.query) {
    const callerId = socket.handshake.query.callerId;
    socket.user = callerId;
    next();
  }
});

IO.on("connection", (socket) => {
  socket.join(socket.user);

  console.log(socket.user, "Joined");

  socket.on("makeCall", (data) => {
    const calleeId = data.calleeId;
    const sdpOffer = data.sdpOffer;

    console.log(sdpOffer);

    socket.to(calleeId).emit("newCall", {
      callerId: socket.user,
      sdpOffer: sdpOffer,
    });
  });

  socket.on("answerCall", (data) => {
    const callerId = data.callerId;
    const sdpAnswer = data.sdpAnswer;

    console.log(sdpAnswer);

    socket.to(callerId).emit("callAnswered", {
      callee: socket.user,
      sdpAnswer: sdpAnswer,
    });
  });

  socket.on("IceCandidate", (data) => {
    const calleeId = data.calleeId;
    const iceCandidate = data.iceCandidate;

    console.log(iceCandidate);

    socket.to(calleeId).emit("IceCandidate", {
      sender: socket.user,
      iceCandidate: iceCandidate,
    });
  });

  socket.on("disconnect", (data) => {
    const calleeId = data.calleeId;

    console.log(socket.user, "left");
    socket.to(calleeId).emit(socket.user, "left");
  });
});

app.get("/", (req, res) => {
  res.send("Welcome!");
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
