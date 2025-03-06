const express = require('express');
const channelController = require('../controllers/channels');
const messagesController = require('../controllers/messages');
const filesController = require('../controllers/files');

const router = express.Router();

// Workspace channels
router.get('/workspace/:workspaceId', channelController.getAllWorkspaceChannels);

// Channel specific endpoints
router.get('/:channelId', channelController.getChannelById);
router.patch('/:channelId', channelController.updateChannel);
router.delete('/:channelId', channelController.deleteChannel);

// Channel members
router.get('/:channelId/members', channelController.getChannelMembers);
router.post('/:channelId/members', channelController.addChannelMembers);
router.delete('/:channelId/members/:userId', channelController.removeChannelMember);

// Join/Leave channel
router.post('/:channelId/join', channelController.joinChannel);
router.delete('/:channelId/leave', channelController.leaveChannel);

// Channel messages
router.get('/:channelId/messages', channelController.getChannelMessages);
router.post('/:channelId/messages', messagesController.createMessage);

// Channel files
router.get('/:channelId/files', filesController.getChannelFiles);

// Pinned items
router.get('/:channelId/pins', channelController.getPinnedItems);
router.post('/:channelId/pins', channelController.pinItem);
router.delete('/:channelId/pins/:pinnedItemId', channelController.unpinItem);

// Create channel in workspace - this endpoint should be in workspaces route but we support it here too
router.post('/create/:workspaceId', channelController.createChannel);

// User channels
router.get('/user/me', channelController.getUserChannels);

module.exports = router;