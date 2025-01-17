const express = require('express')
const { createServer } = require('node:http')
const { join } = require('node:path')
const { initSocket } = require('./socket')
const { auth, requiresAuth } = require('express-openid-connect')
const router = require('./routes')
const errorHandler = require('./middleware/errorHandler.middleware')
const { sequelize, testConnection } = require('./middleware/database')
const NodeCache = require('node-cache')

const app = express()
const port = process.env.PORT
const server = createServer(app)
const cache = new NodeCache()


// For development
// const ngrok = require('ngrok');
// (async () => {
//   await ngrok.kill()
//   const url = await ngrok.connect(port)
//   console.log(url)
// })()
const cors = require('cors')
app.use(cors())


// Important middleware
const config = {
  authRequired: process.env.AUTH0_REQUIRED,
  auth0Logout: true,
  baseURL: process.env.BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_DOMAIN,
  secret: process.env.AUTH0_SECRET
}
app.use(express.json())
app.use(auth(config))

// Route for the main page
app.use('/', router)
app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

// Socket implementation
initSocket(server)

// Error handling
app.use(errorHandler)

// Test the database connection
testConnection()

// Start the server
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
