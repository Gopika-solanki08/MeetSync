import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "https://meet-sync-taupe.vercel.app",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
   
    socket.on("join-call", (path) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }

      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      //  FIX: event name
      connections[path].forEach((id) => {
        io.to(id).emit("user-joined", socket.id, connections[path]);
      });

      if (messages[path] !== undefined) {
        messages[path].forEach((msg) => {
          io.to(socket.id).emit("chat-message", {
            message: msg.message,
            sender: msg.sender,
            socketId: msg.socketId,
            time: msg.time,
          });
        });
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const [room, found] = Object.entries(connections).reduce(
        ([r, f], [key, val]) => {
          if (!f && val.includes(socket.id)) return [key, true];
          return [r, f];
        },
        ["", false],
      );

      if (found) {
        if (!messages[room]) messages[room] = [];
        messages[room].push({
          sender: sender,
          message: data,
          socketId: socket.id,
          time: new Date(),
        });

        connections[room].forEach((id) => {
          io.to(id).emit("chat-message", {
            message: data,
            sender: sender,
            socketId: socket.id,
          });
        });
      }
    });

    socket.on("disconnect", () => {
      for (const [room, users] of Object.entries(connections)) {
        if (users.includes(socket.id)) {
          users.forEach((id) => {
            io.to(id).emit("user-left", socket.id);
          });

          connections[room] = users.filter((id) => id !== socket.id);

          if (connections[room].length === 0) {
            delete connections[room];
          }
        }
      }
    });
  });

  return io;
};
