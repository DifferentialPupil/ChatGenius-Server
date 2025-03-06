const express = require('express');
const router = express.Router();
const channelMembersController = require('../controllers/channelmembers');

// Get all channel members (admin access)
router.get('/', channelMembersController.getAllChannelMembers);

// Get current user's channel memberships
router.get('/me', channelMembersController.getMyChannelMemberships);

// Check if current user is a member of a specific channel
router.get('/check/:channelId', channelMembersController.checkChannelMembership);

// Get all members of a specific channel
router.get('/channel/:channelId', channelMembersController.getChannelMembersByChannelId);

// Get all channels a specific user is a member of
router.get('/user/:userId', channelMembersController.getChannelMembersByUserId);

// Get a specific channel member by channel and user IDs
router.get('/channel/:channelId/user/:userId', channelMembersController.getChannelMemberByChannelAndUser);

// Get a specific channel member by ID
router.get('/:channelMemberId', channelMembersController.getChannelMemberById);

// Add a single member to a channel
router.post('/', channelMembersController.addChannelMember);

// Bulk add members to a channel
router.post('/bulk', channelMembersController.bulkAddChannelMembers);

// Update a channel member's role
router.patch('/:channelMemberId', channelMembersController.updateChannelMember);

// Remove a member from a channel
router.delete('/:channelMemberId', channelMembersController.removeChannelMember);

module.exports = router;
