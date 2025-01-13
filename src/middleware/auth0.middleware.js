// Middleware for Auth0 authentication
// Code has been adapted from https://github.com/auth0-developer-hub/api_express_javascript_hello-world/blob/basic-authorization/src/middleware/auth0.middleware.js

const { auth } = require('express-oauth2-jwt-bearer')

const validateAccessToken = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_DOMAIN
})

module.exports = validateAccessToken