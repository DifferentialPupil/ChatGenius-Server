const express = require('express')
const { createServer } = require('node:http')
const { join } = require('node:path')
const { initSocket } = require('./socket')
const router = require('./routes')
const errorHandler = require('./middleware/errorHandler.middleware')
const { sequelize, testConnection } = require('./middleware/database')
const WebSocket = require('ws');
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');
const { attachUser } = require('./middleware/attachUser');

const app = express()
const port = process.env.PORT
const server = createServer(app)

// For development
// const ngrok = require('ngrok');
// (async () => {
//   await ngrok.kill()
//   const url = await ngrok.connect(port)
//   console.log(url)
// })()
const cors = require('cors')
app.use(cors({
  origin: "*",
  credentials: true
}))

// Important middleware
app.use(express.json())

// Serve static files from public directory
app.use(express.static(join(__dirname, 'public')));

// Define a route for API documentation
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public/index.html'));
});

// Auth0 middleware - apply after documentation route
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_DOMAIN
});

// Apply auth middleware to API routes and attach user to request
app.use('/api', checkJwt, attachUser);

// Route for the API endpoints
app.use('/api', router)

// Socket implementation
const wss = initSocket(server)

function heartbeat() {
  // TODO: Implement heartbeat
}

// Error handling
app.use(errorHandler)

// Test the database connection
testConnection()

// Start the server
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
