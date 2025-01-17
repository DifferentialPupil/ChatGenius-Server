module.exports = (io, socket) => {
    let currentRoom = '1'
    console.log('a user connected')
    socket.join(currentRoom)

    socket.on('disconnect', () => {
        console.log('a user disconnected')
    })

    // socket.on('chat message', (msg) => {
    //     console.log('message: ' + msg)
    //     io.to(currentRoom).emit('chat message', 'Message received: ' + msg)
    // })
}