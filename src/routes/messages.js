const express = require('express');
const Message = require('../controllers/messages');

const router = express.Router();

router
    .get('/:channelid', Message.getAllChannelMessages)
    .post('/', Message.createChannelMessage)
    .patch('/', Message.updateChannelMessage)
    .delete('/', Message.deleteChannelMessage)

module.exports = router;