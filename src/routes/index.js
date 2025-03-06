/**
 * Master router that combines all sub-routes
 */
const express = require('express');
const router = express.Router();

const { router: userRoutes, aiRouter} = require('./users');
const channelRoutes = require('./channels');
const channelMembersRoutes = require('./channelmembers');
const messageRoutes = require('./messages');
const directMessagesRoutes = require('./directMessages');
const workspaceRoutes = require('./workspaces');
const workspaceMembersRoutes = require('./workspacemembers');
const fileRoutes = require('./files');
const notificationRoutes = require('./notifications');
const threadRoutes = require('./threads');
const mentionRoutes = require('./mentions');

// Sub-routes
router.use('/users', userRoutes);
router.use('/ai', aiRouter);
router.use('/channels', channelRoutes);
router.use('/channelmembers', channelMembersRoutes);
router.use('/messages', messageRoutes);
router.use('/directmessages', directMessagesRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspacemembers', workspaceMembersRoutes);
router.use('/files', fileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/threads', threadRoutes);
router.use('/mentions', mentionRoutes);

module.exports = router;