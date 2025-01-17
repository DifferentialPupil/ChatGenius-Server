/**
 * Master router that combines all sub-routes
 */
const express = require('express');
const router = express.Router();
const userRoutes = require('./users');
const channelRoutes = require('./channels');
const channelMembersRoutes = require('./channelmembers');
const messageRoutes = require('./messages');
const workspaceRoutes = require('./workspaces');
const workspaceMembersRoutes = require('./workspacemembers');

// Example route definitions
// router.use('/users', userRoutes);

// Root route
router.get('/', (req, res) => {
  res.send('Hello World')
})

// Sub-routes
router.use('/users', userRoutes);
router.use('/channels', channelRoutes);
router.use('/channelmembers', channelMembersRoutes);
router.use('/messages', messageRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspacemembers', workspaceMembersRoutes);

module.exports = router;