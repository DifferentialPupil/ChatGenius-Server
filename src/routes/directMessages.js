const express = require('express');
const directMessagesController = require('../controllers/directMessages');

const router = express.Router();

// Direct message routes
router.get('/:directMessageId', directMessagesController.getDirectMessageById);
router.patch('/:directMessageId', directMessagesController.updateDirectMessage);
router.delete('/:directMessageId', directMessagesController.deleteDirectMessage);

// Direct message reactions
router.post('/:directMessageId/reactions', directMessagesController.addReaction);
router.delete('/:directMessageId/reactions/:reactionId', directMessagesController.removeReaction);

// Conversations
router.get('/me', directMessagesController.getUserConversations);
router.get('/conversations/:userId', directMessagesController.getConversationMessages);
router.post('/:recipientId', directMessagesController.sendDirectMessage);

module.exports = router; 