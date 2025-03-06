const { Op } = require('sequelize');
const { Message, User, Channel, ChannelMember, Reaction, File, Mention } = require('../models');

/**
 * Get thread by parent message ID
 * @route GET /api/threads/:parentMessageId
 */
const getThreadByParentId = async (req, res) => {
    try {
        const { parentMessageId } = req.params;
        const { limit = 50, before, after } = req.query;
        
        // First, find the parent message to ensure it exists and user has access
        const parentMessage = await Message.findByPk(parentMessageId, {
            include: [{
                model: Channel,
                as: 'channel',
                attributes: ['channelId', 'isPublic']
            }]
        });
        
        if (!parentMessage) {
            return res.status(404).json({ error: 'Parent message not found' });
        }
        
        // Check if user has access to the channel
        if (!parentMessage.channel.isPublic) {
            const isMember = await ChannelMember.findOne({
                where: {
                    channelId: parentMessage.channelId,
                    userId: req.user.userId
                }
            });
            
            if (!isMember) {
                return res.status(403).json({ error: 'You do not have access to this thread' });
            }
        }

        // Get the parent message with extended information
        const threadParent = await Message.findByPk(parentMessageId, {
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                },
                {
                    model: Reaction,
                    as: 'reactions',
                    include: {
                        model: User,
                        as: 'user',
                        attributes: ['userId', 'username', 'displayName']
                    }
                },
                {
                    model: File,
                    as: 'files',
                    attributes: ['fileId', 'filename', 'fileUrl', 'fileSize', 'mimeType']
                }
            ]
        });
        
        // Build query conditions for replies
        const where = { 
            parentMessageId,
            isDeleted: false
        };
        
        if (before) {
            where.created_at = { [Op.lt]: new Date(before) };
        } else if (after) {
            where.created_at = { [Op.gt]: new Date(after) };
        }
        
        // Fetch thread replies with pagination
        const replies = await Message.findAll({
            where,
            limit: parseInt(limit, 10),
            order: before ? [['created_at', 'DESC']] : [['created_at', 'ASC']],
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                },
                {
                    model: Reaction,
                    as: 'reactions',
                    include: {
                        model: User,
                        as: 'user',
                        attributes: ['userId', 'username', 'displayName']
                    }
                },
                {
                    model: File,
                    as: 'files',
                    attributes: ['fileId', 'filename', 'fileUrl', 'fileSize', 'mimeType']
                }
            ]
        });
        
        // If we queried in descending order, reverse for client
        const threadReplies = before ? replies.reverse() : replies;
        
        // Return both the parent message and its replies
        res.json({
            parent: threadParent,
            replies: threadReplies
        });
    } catch (error) {
        console.error('Error fetching thread:', error);
        res.status(500).json({ error: 'An error occurred while fetching the thread' });
    }
};

/**
 * Create a new thread reply
 * @route POST /api/threads/:parentMessageId
 */
const createThreadReply = async (req, res) => {
    try {
        const { parentMessageId } = req.params;
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Reply content cannot be empty' });
        }
        
        // Find the parent message
        const parentMessage = await Message.findByPk(parentMessageId, {
            include: [{
                model: Channel,
                as: 'channel',
                attributes: ['channelId', 'isPublic']
            }]
        });
        
        if (!parentMessage) {
            return res.status(404).json({ error: 'Parent message not found' });
        }
        
        // Check if user has access to the channel
        if (!parentMessage.channel.isPublic) {
            const isMember = await ChannelMember.findOne({
                where: {
                    channelId: parentMessage.channelId,
                    userId: req.user.userId
                }
            });
            
            if (!isMember) {
                return res.status(403).json({ error: 'You do not have access to this channel' });
            }
        }
        
        // Create the thread reply
        const reply = await Message.create({
            channelId: parentMessage.channelId,
            senderId: req.user.userId,
            content,
            parentMessageId
        });
        
        // Process mentions
        const mentionRegex = /@(\w+)/g;
        const mentions = content.match(mentionRegex);
        
        if (mentions) {
            // Extract usernames from mentions
            const usernames = mentions.map(mention => mention.substring(1));
            
            // Find users by usernames
            const mentionedUsers = await User.findAll({
                where: {
                    username: usernames
                }
            });
            
            // Create mention records
            for (const user of mentionedUsers) {
                await Mention.create({
                    messageId: reply.messageId,
                    userId: user.userId
                });
                
                // Notification logic could be added here
            }
        }
        
        // Fetch the reply with associations
        const replyWithAssociations = await Message.findByPk(reply.messageId, {
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                }
            ]
        });
        
        // Socket.io event emission would go here
        // io.to(`channel:${parentMessage.channelId}`).emit('new_thread_reply', {
        //     ...replyWithAssociations.toJSON(),
        //     parentMessageId
        // });
        
        res.status(201).json(replyWithAssociations);
    } catch (error) {
        console.error('Error creating thread reply:', error);
        res.status(500).json({ error: 'An error occurred while creating the thread reply' });
    }
};

/**
 * Update a thread reply
 * @route PATCH /api/threads/:threadId
 */
const updateThreadReply = async (req, res) => {
    try {
        const { threadId } = req.params;
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Reply content cannot be empty' });
        }
        
        // Find the thread reply
        const threadReply = await Message.findByPk(threadId, {
            include: [{
                model: Channel,
                as: 'channel',
                attributes: ['channelId', 'isPublic']
            }]
        });
        
        if (!threadReply) {
            return res.status(404).json({ error: 'Thread reply not found' });
        }
        
        // Ensure this is actually a thread reply
        if (!threadReply.parentMessageId) {
            return res.status(400).json({ error: 'This message is not a thread reply' });
        }
        
        // Check if user is the sender of the thread reply
        if (threadReply.senderId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only edit your own thread replies' });
        }
        
        // Check if thread reply is deleted
        if (threadReply.isDeleted) {
            return res.status(400).json({ error: 'Cannot edit a deleted thread reply' });
        }
        
        // Update the thread reply
        await threadReply.update({
            content,
            isEdited: true
        });
        
        // Process mentions
        const mentionRegex = /@(\w+)/g;
        const mentions = content.match(mentionRegex);
        
        if (mentions) {
            // Remove existing mentions
            await Mention.destroy({ where: { messageId: threadId } });
            
            // Extract usernames from mentions
            const usernames = mentions.map(mention => mention.substring(1));
            
            // Find users by usernames
            const mentionedUsers = await User.findAll({
                where: {
                    username: usernames
                }
            });
            
            // Create new mention records
            for (const user of mentionedUsers) {
                await Mention.create({
                    messageId: threadId,
                    userId: user.userId
                });
                
                // Notification logic could be added here
            }
        }
        
        // Fetch the updated thread reply with associations
        const updatedReply = await Message.findByPk(threadId, {
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                },
                {
                    model: Reaction,
                    as: 'reactions',
                    include: {
                        model: User,
                        as: 'user',
                        attributes: ['userId', 'username', 'displayName']
                    }
                }
            ]
        });
        
        // Socket.io event emission would go here
        // io.to(`channel:${threadReply.channelId}`).emit('thread_reply_updated', updatedReply);
        
        res.json(updatedReply);
    } catch (error) {
        console.error('Error updating thread reply:', error);
        res.status(500).json({ error: 'An error occurred while updating the thread reply' });
    }
};

/**
 * Delete a thread reply
 * @route DELETE /api/threads/:threadId
 */
const deleteThreadReply = async (req, res) => {
    try {
        const { threadId } = req.params;
        
        // Find the thread reply
        const threadReply = await Message.findByPk(threadId, {
            include: [{
                model: Channel,
                as: 'channel',
                attributes: ['channelId', 'isPublic']
            }]
        });
        
        if (!threadReply) {
            return res.status(404).json({ error: 'Thread reply not found' });
        }
        
        // Ensure this is actually a thread reply
        if (!threadReply.parentMessageId) {
            return res.status(400).json({ error: 'This message is not a thread reply' });
        }
        
        // Check if user is the sender or has admin permissions
        if (threadReply.senderId !== req.user.userId) {
            // TODO: Check if user is an admin for the channel or workspace
            return res.status(403).json({ error: 'You can only delete your own thread replies' });
        }
        
        // Soft delete the thread reply
        await threadReply.update({
            isDeleted: true
        });
        
        // Socket.io event emission would go here
        // io.to(`channel:${threadReply.channelId}`).emit('thread_reply_deleted', {
        //     threadId,
        //     parentMessageId: threadReply.parentMessageId,
        //     channelId: threadReply.channelId
        // });
        
        res.json({ message: 'Thread reply deleted successfully' });
    } catch (error) {
        console.error('Error deleting thread reply:', error);
        res.status(500).json({ error: 'An error occurred while deleting the thread reply' });
    }
};

/**
 * Get thread replies by parent message ID
 * @route GET /api/threads/:parentMessageId/replies
 */
const getThreadReplies = async (req, res) => {
    try {
        const { parentMessageId } = req.params;
        const { limit = 50, before, after } = req.query;
        
        // Verify parent message exists and user has access
        const parentMessage = await Message.findByPk(parentMessageId, {
            include: [{
                model: Channel,
                as: 'channel',
                attributes: ['channelId', 'isPublic']
            }]
        });
        
        if (!parentMessage) {
            return res.status(404).json({ error: 'Parent message not found' });
        }
        
        // Check if user has access to the channel
        if (!parentMessage.channel.isPublic) {
            const isMember = await ChannelMember.findOne({
                where: {
                    channelId: parentMessage.channelId,
                    userId: req.user.userId
                }
            });
            
            if (!isMember) {
                return res.status(403).json({ error: 'You do not have access to this thread' });
            }
        }
        
        // Build query conditions
        const where = { 
            parentMessageId,
            isDeleted: false
        };
        
        if (before) {
            where.created_at = { [Op.lt]: new Date(before) };
        } else if (after) {
            where.created_at = { [Op.gt]: new Date(after) };
        }
        
        // Fetch thread replies with pagination
        const replies = await Message.findAll({
            where,
            limit: parseInt(limit, 10),
            order: before ? [['created_at', 'DESC']] : [['created_at', 'ASC']],
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                },
                {
                    model: Reaction,
                    as: 'reactions',
                    include: {
                        model: User,
                        as: 'user',
                        attributes: ['userId', 'username', 'displayName']
                    }
                },
                {
                    model: File,
                    as: 'files',
                    attributes: ['fileId', 'filename', 'fileUrl', 'fileSize', 'mimeType']
                }
            ]
        });
        
        // If we queried in descending order, reverse for client
        const result = before ? replies.reverse() : replies;
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching thread replies:', error);
        res.status(500).json({ error: 'An error occurred while fetching thread replies' });
    }
};

module.exports = {
    getThreadByParentId,
    createThreadReply,
    updateThreadReply,
    deleteThreadReply,
    getThreadReplies
}; 