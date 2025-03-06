const express = require('express');
const threadsController = require('../controllers/threads');

const router = express.Router();

// Get thread by parent message ID with its replies
router.get('/:parentMessageId', threadsController.getThreadByParentId);

// Get just the replies for a thread
router.get('/:parentMessageId/replies', threadsController.getThreadReplies);

// Create a new thread reply
router.post('/:parentMessageId', threadsController.createThreadReply);

// Update a thread reply
router.patch('/:threadId', threadsController.updateThreadReply);

// Delete a thread reply
router.delete('/:threadId', threadsController.deleteThreadReply);

module.exports = router; 