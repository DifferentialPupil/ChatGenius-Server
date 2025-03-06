const express = require('express');
const router = express.Router();
const {
    getMentionById,
    markMentionAsRead,
    markAllMentionsAsRead,
} = require('../controllers/mentions');

// Get a specific mention by ID
router.get('/:mentionId', getMentionById);

// Mark a mention as read
router.patch('/:mentionId/read', markMentionAsRead);

// Mark all mentions as read
router.patch('/read-all', markAllMentionsAsRead);

// User-specific mention routes are defined in the userRoutes file
// but we'll include them here for reference:
// GET /api/users/me/mentions - getUserMentions
// GET /api/users/me/mentions/count - countUnreadMentions

module.exports = router; 