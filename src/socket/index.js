/**
 * Initialize and configure Socket.IO
 */

const { Server } = require('socket.io');
const eventHandlers = require('./eventHandlers');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
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

module.exports = initSocket;