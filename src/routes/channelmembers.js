const express = require('express');
const ChannelMember = require('../controllers/channelmembers')

const router = express.Router();

router.get('/', ChannelMember.getAllChannelMembers)
    .post('/', ChannelMember.joinChannel)
    .delete('/', ChannelMember.leaveChannel)
    .put('/add', ChannelMember.addMemberToChannel)
    .put('/remove', ChannelMember.removeMemberFromChannel)
    .patch('/', ChannelMember.updateMemberRole)

module.exports = router;
