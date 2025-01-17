const { Channel, Workspace } = require('../models')
const cache = require('../middleware/cache')

const getAllWorkspaceChannels = async (req, res) => {
    const { workspaceid } = req.params
    console.log(workspaceid)

    if (await workspaceExists(workspaceid)) {
        const channels = await Channel.findAll({ where: { workspaceid: workspaceid } })
        res.status(200).json(channels)
        return
    }

    res.status(400).json({ error: 'Workspace does not exist' })
}

const createWorkspaceChannel = async (req, res) => {
    const { workspaceid, name, description, ispublic, topic } = req.body
    const createdbyuserid = await cache.getUserId(req.oidc.user.sub)

    if (workspaceid === undefined || name === undefined || ispublic === undefined) {
        res.status(400).json({ error: 'Workspace ID, Name, and Is Public are required' })
        return
    }

    if (await workspaceExists(workspaceid)) {
        const channel = await Channel.create({ workspaceid, name, description, ispublic, topic, createdbyuserid })
        res.status(201).json(channel)
        return
    }

    res.status(400).json({ error: 'Workspace does not exist' })
}

const updateWorkspaceChannel = async (req, res) => {
    const { channelid, name, description, ispublic, topic, createdbyuserid } = req.body


    if (channelid === undefined) {
        res.status(400).json({ error: 'Channel ID is required' })
        return
    }

    args = {}
    if (name !== undefined) {args.name = name}
    if (description !== undefined) { args.description = description }
    if (ispublic !== undefined) { args.ispublic = ispublic }
    if (topic !== undefined) { args.topic = topic }
    if (createdbyuserid !== undefined) { args.createdbyuserid = createdbyuserid }

    if (await channelExists(channelid)) {
        await Channel.update(args, { where: { channelid: channelid } })
        res.status(200).json({ message: 'Channel updated successfully' })
        return
    }

    res.status(400).json({ error: 'Channel does not exist' })
}

const deleteWorkspaceChannel = async (req, res) => {
    const { channelid } = req.body

    if (channelid === undefined) {
        res.status(400).json({ error: 'Channel ID is required' })
        return
    }

    if (await channelExists(channelid)) {
        await Channel.destroy({ where: { channelid: channelid } })
        res.status(200).json({ message: 'Channel deleted successfully' })
        return
    }

    res.status(400).json({ error: 'Channel does not exist' })
}

function workspaceExists(workspaceid) {
    return Workspace.findOne({ where: { workspaceid: workspaceid }, attributes: ['workspaceid'] })
}

function channelExists(channelid) {
    return Channel.findOne({ where: { channelid: channelid }, attributes: ['channelid'] })
}

module.exports = {
    getAllWorkspaceChannels,
    createWorkspaceChannel,
    updateWorkspaceChannel,
    deleteWorkspaceChannel
}