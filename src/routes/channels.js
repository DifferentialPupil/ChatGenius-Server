const express = require('express');
const Channel = require('../controllers/channels');

const router = express.Router();

// GET /api/users/me
router
    .get('/:workspaceid', Channel.getAllWorkspaceChannels)
    .post('/', Channel.createWorkspaceChannel)
    .patch('/', Channel.updateWorkspaceChannel)
    .delete('/', Channel.deleteWorkspaceChannel)

module.exports = router;