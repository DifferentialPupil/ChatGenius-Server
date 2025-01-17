/**
 * Initialize and configure Socket.IO
 */

const { Server } = require('socket.io');
const eventHandlers = require('./eventHandlers');
let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  // Listen for socket connections
  io.on('connection', (socket) => {
    // Attach event handlers for each new connection
    eventHandlers(io, socket);
  });

  return io;
}

function getIO() {
  if (!io) {
    next(new Error('Socket.IO is not initialized'));
  }
  return io;
}

module.exports = {
  initSocket,
  getIO
};