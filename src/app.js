const express = require('express')
const { createServer } = require('node:http')
const { join } = require('node:path')
const initSocket = require('./socket/index')
const validateAccessToken = require('./middleware/auth0.middleware')

const app = express()
const port = process.env.PORT
const server = createServer(app)

// For development
const cors = require('cors')
app.use(cors())

// Route for the main page
app.get('/', validateAccessToken, (req, res) => {
  res.send('Hello World')
})

// Socket implementation
initSocket(server)

// Start the server
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
