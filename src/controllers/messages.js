const { Message } = require('../models')
const { Channel } = require('../models')
const { getUserId } = require('../middleware/cache')
const { getIO } = require('../socket')

const getAllChannelMessages = async (req, res) => {
    try {
        const channelid = req.params.channelid

        if (await channelExists(channelid)) {
            const messages = await Message.findAll({where: { channelid: channelid }})
            res.status(200).json(messages)
            return
        }

        res.status(404).json({ error: 'Channel not found' })
    } catch (error) {
        console.log(error)
    }
}

const getPaginatedChannelMessages = async (req, res) => {
    const { channelid, page, limit } = req.body

    if (channelid === undefined) {
        res.status(400).json({ error: 'Channel ID is required' })
        return
    }

    if (await channelExists(channelid)) {
        const messages = await Message.findAll({ 
            where: { channelid: channelid },
            offset: (page - 1) * limit,
            limit: limit,
            order: [['createdat', 'DESC']] 
        })
        res.status(200).json(messages)
        return
    }

    res.status(404).json({ error: 'Channel not found' })
}

const createChannelMessage = async (req, res) => {
    const { channelid, content, fileid } = req.body

    if (channelid === undefined || content === undefined) {
        res.status(400).json({ error: 'Channel ID and Content are required' })
        return
    }

    if (await channelExists(channelid)) {
        const senderid = await getUserId(req.oidc.user.sub)
        const message = await Message.create({ channelid, content, senderid, fileid })
        res.status(201).json(message)
        return
    }

    res.status(404).json({ error: 'Channel not found' })
}

const updateChannelMessage = async (req, res) => {
    const { messageid, content } = req.body

    if (messageid === undefined || content === undefined) {
        res.status(400).json({ error: 'Message ID and Content are required' })
        return
    }

    if (await messageExists(messageid)) {
        const message = await Message.update({ content }, { where: { messageid: messageid } })
        res.status(200).json(message)
        return
    }

    res.status(404).json({ error: 'Message not found' })
}

const deleteChannelMessage = async (req, res) => {
    
}

const channelExists = async (channelId) => {
    return Channel.findByPk(channelId)
}

const messageExists = async (messageId) => {
    return Message.findByPk(messageId)
}

module.exports = {
    getAllChannelMessages,
    createChannelMessage,
    updateChannelMessage,
    deleteChannelMessage
}