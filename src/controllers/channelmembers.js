const { ChannelMember } = require('../models')
const { getUserId } = require('../middleware/cache')
const { getIO } = require('../socket')

const getAllChannelMembers = async (req, res) => {
    const channelid = req.body.channelid
    const channelMembers = await ChannelMember.findAll({ where: { channelid: channelid } })
    res.status(200).json(channelMembers)
}

const joinChannel = async (req, res) => {
    const { channelid, role } = req.body
    const userid = await getUserId(req.oidc.user.sub)
    console.log(userid)

    if (channelExists(channelid)) {

        if (await memberOfChannel(channelid, userid)) {
            res.status(400).json({ error: 'User already in channel' })
            return
        }

        if (role !== 'Member' && role !== 'Admin') {
            res.status(400).json({ error: 'Invalid role' })
            return
        }

        const channelMember = await ChannelMember.create({
            channelid: channelid,
            userid: userid,
            role: role
        })
        res.status(201).json(channelMember)
        return
    }

    res.status(404).json({ error: 'Channel not found' })
}

const leaveChannel = async (req, res) => {
    const { channelid } = req.body
    const userid = await getUserId(req.oidc.user.sub)

    if (await channelExists(channelid)) {
        if (await memberOfChannel(channelid, userid)) { 
            await ChannelMember.destroy({ where: { channelid: channelid, userid: userid } })
            res.status(200).json({ message: 'User left channel' })
            return
        }

        res.status(404).json({ error: 'User not in channel' })
        return
    }

    res.status(404).json({ error: 'Channel not found' })
}

const addMemberToChannel = async (req, res) => {
    res.send('Add a member to a channel')
}

const removeMemberFromChannel = async (req, res) => {
    res.send('Remove a member from a channel')
}

const updateMemberRole = async (req, res) => {
    res.send('Update a member\'s role in a channel')
}

function channelExists(channelid) {
    return ChannelMember.findOne({ where: { channelid: channelid }, attributes: ['channelid'] })
}

function memberOfChannel(channelid, userid) {
    return ChannelMember.findOne({ where: { channelid: channelid, userid: userid }, attributes: ['channelid', 'userid'] })
}

module.exports = {
    getAllChannelMembers,
    joinChannel,
    leaveChannel,
    addMemberToChannel,
    removeMemberFromChannel,
    updateMemberRole
}