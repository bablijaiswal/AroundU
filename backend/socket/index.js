export function initializeSocket(io) {
  io.on('connection', (socket) => {
    socket.emit('socket:ready', { message: 'Connected to AroundU realtime server' });

    socket.on('disconnect', () => {
      // Socket closed cleanly.
    });
  });

  return io;
}
