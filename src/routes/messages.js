const express = require('express');
const messagesController = require('../controllers/messages');

const router = express.Router();

// Message routes
router.get('/:messageId', messagesController.getMessageById);
router.patch('/:messageId', messagesController.updateMessage);
router.delete('/:messageId', messagesController.deleteMessage);

// Thread routes
router.get('/:messageId/threads', messagesController.getThreadReplies);
router.post('/:messageId/threads', messagesController.createThreadReply);

// Reaction routes
router.post('/:messageId/reactions', messagesController.addReaction);
router.delete('/:messageId/reactions/:reactionId', messagesController.removeReaction);

module.exports = router;