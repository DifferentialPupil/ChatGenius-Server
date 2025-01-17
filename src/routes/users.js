const express = require('express');
const { getAllUsers, getUserById, createUser, findUserByDisplayName, getCurrentUser } = require('../controllers/users');

const router = express.Router();

// GET /api/users/me
router
  .get('/', getAllUsers)
  .get('/authid/:auth0id', getCurrentUser)
  .get('/:id', getUserById)
  .post('/', createUser)
  .get('/name/:displayname', findUserByDisplayName)
  

module.exports = router;