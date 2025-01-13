module.exports = (io, socket) => {
    let currentRoom = '1'
    console.log('a user connected')
    socket.join(currentRoom)

    socket.on('disconnect', () => {
        console.log('a user disconnected')
    })

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg)
        io.to(currentRoom).emit('chat message', 'Message received: ' + msg)
    })

    socket.on('join room', (room) => {
        if (room == '1') {
        currentRoom = '1'
        socket.join('1')
        socket.leave('2')
        } else if (room == '2') {
        currentRoom = '2'
        socket.join('2')
        socket.leave('1')
        }
    })
}