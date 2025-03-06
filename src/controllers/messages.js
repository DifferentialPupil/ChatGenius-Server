const { Op } = require('sequelize');
const { Message, User, Channel, ChannelMember, Reaction, File, Mention, PinnedItem } = require('../models');
// const io = require('../socket'); // Assuming socket.io is set up in this file

/**
 * Get message by ID
 * @route GET /api/messages/:messageId
 */
const getMessageById = async (req, res) => {
    try {
        const { messageId } = req.params;
        
        const message = await Message.findOne({
            where: { 
                messageId,
                isDeleted: false 
            },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                },
                {
                    model: Channel,
                    as: 'channel',
                    attributes: ['channelId', 'name', 'isPublic']
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
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        // Check if user has access to this message's channel
        if (!message.channel.isPublic) {
            const isMember = await ChannelMember.findOne({
                where: {
                    channelId: message.channelId,
                    userId: req.user.userId
                }
            });
            
            if (!isMember) {
                return res.status(403).json({ error: 'You do not have access to this message' });
            }
        }
        
        res.json(message);
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ error: 'An error occurred while fetching the message' });
    }
};

/**
 * Create a new message in a channel
 * @route POST /api/channels/:channelId/messages
 */
const createMessage = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content cannot be empty' });
        }
        
        // Verify channel exists
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if user is a member of the channel
        const isMember = await ChannelMember.findOne({
            where: {
                channelId,
                userId: req.user.userId
            }
        });
        
        if (!isMember && !channel.isPublic) {
            return res.status(403).json({ error: 'You do not have access to this channel' });
        }
        
        // Create the message
        const message = await Message.create({
            channelId,
            senderId: req.user.userId,
            content
        });
        
        // Process mentions if any (Simple implementation - can be enhanced)
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
            
            // Create mention records and notifications
            for (const user of mentionedUsers) {
                await Mention.create({
                    messageId: message.messageId,
                    userId: user.userId
                });
                
                // Create notification for the mentioned user
                // This would be implemented in your notification system
            }
        }
        
        // Fetch the created message with associations for the response
        const messageWithAssociations = await Message.findByPk(message.messageId, {
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url']
                }
            ]
        });
        
        // Emit socket event for real-time update
        // io.to(`channel:${channelId}`).emit('new_message', messageWithAssociations);
        
        res.status(201).json(messageWithAssociations);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'An error occurred while creating the message' });
    }
};

/**
 * Update a message
 * @route PATCH /api/messages/:messageId
 */
const updateMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content cannot be empty' });
        }
        
        // Find the message
        const message = await Message.findByPk(messageId, {
            include: [{
                model: Channel,
                as: 'channel',
                attributes: ['channelId', 'isPublic']
            }]
        });
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        // Check if user is the sender of the message
        if (message.senderId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only edit your own messages' });
        }
        
        // Check if message is deleted
        if (message.isDeleted) {
            return res.status(400).json({ error: 'Cannot edit a deleted message' });
        }
        
        // Update the message
        await message.update({
            content,
            isEdited: true
        });
        
        // Process mentions if any (similar to create)
        const mentionRegex = /@(\w+)/g;
        const mentions = content.match(mentionRegex);
        
        if (mentions) {
            // Remove existing mentions
            await Mention.destroy({ where: { messageId } });
            
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
                    messageId,
                    userId: user.userId
                });
                
                // Create notification for the mentioned user if needed
            }
        }
        
        // Fetch the updated message with associations for the response
        const updatedMessage = await Message.findByPk(messageId, {
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
        
        // Emit socket event for real-time update
        // io.to(`channel:${message.channelId}`).emit('message_updated', updatedMessage);
        
        res.json(updatedMessage);
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: 'An error occurred while updating the message' });
    }
};

/**
 * Delete a message (soft delete)
 * @route DELETE /api/messages/:messageId
 */
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        
        // Find the message
        const message = await Message.findByPk(messageId, {
            include: [{
                model: Channel,
                as: 'channel',
                attributes: ['channelId']
            }]
        });
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        // Check if user is the sender of the message or an admin
        // For now, only the sender can delete their message
        if (message.senderId !== req.user.userId) {
            // Check if user is a workspace admin (implementation would depend on your auth system)
            const isAdmin = false; // Replace with actual admin check
            
            if (!isAdmin) {
                return res.status(403).json({ error: 'You can only delete your own messages' });
            }
        }
        
        // Soft delete the message
        await message.update({ isDeleted: true });
        
        // Emit socket event for real-time update
        // io.to(`channel:${message.channelId}`).emit('message_deleted', {
        //     messageId,
        //     channelId: message.channelId
        // });
        
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'An error occurred while deleting the message' });
    }
};

/**
 * Create a thread reply to a message
 * @route POST /api/messages/:messageId/threads
 */
const createThreadReply = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Reply content cannot be empty' });
        }
        
        // Find the parent message
        const parentMessage = await Message.findByPk(messageId, {
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
            parentMessageId: messageId
        });
        
        // Process mentions similar to createMessage
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
                
                // Create notification for the mentioned user if needed
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
        
        // Emit socket event for real-time update
        // io.to(`channel:${parentMessage.channelId}`).emit('new_thread_reply', {
        //     ...replyWithAssociations.toJSON(),
        //     parentMessageId: messageId
        // });
        
        res.status(201).json(replyWithAssociations);
    } catch (error) {
        console.error('Error creating thread reply:', error);
        res.status(500).json({ error: 'An error occurred while creating the thread reply' });
    }
};

/**
 * Get thread replies for a message
 * @route GET /api/messages/:messageId/threads
 */
const getThreadReplies = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { limit = 50, before, after } = req.query;
        
        // Find the parent message
        const parentMessage = await Message.findByPk(messageId, {
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
        
        // Build query conditions
        const where = { 
            parentMessageId: messageId,
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

/**
 * Add a reaction to a message
 * @route POST /api/messages/:messageId/reactions
 */
const addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        
        if (!emoji) {
            return res.status(400).json({ error: 'Emoji is required' });
        }
        
        // Find the message
        const message = await Message.findByPk(messageId, {
            include: [{
                model: Channel,
                as: 'channel',
                attributes: ['channelId', 'isPublic']
            }]
        });
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        // Check if user has access to the channel
        if (!message.channel.isPublic) {
            const isMember = await ChannelMember.findOne({
                where: {
                    channelId: message.channelId,
                    userId: req.user.userId
                }
            });
            
            if (!isMember) {
                return res.status(403).json({ error: 'You do not have access to this channel' });
            }
        }
        
        // Check if user already reacted with this emoji
        const existingReaction = await Reaction.findOne({
            where: {
                messageId: messageId,
                userId: req.user.userId,
                emoji
            }
        });
        
        if (existingReaction) {
            return res.status(400).json({ error: 'You have already reacted with this emoji' });
        }
        
        // Create the reaction
        const reaction = await Reaction.create({
            messageId: messageId,
            directMessageId: null,
            userId: req.user.userId,
            emoji
        });
        
        // Fetch the reaction with user details
        const reactionWithUser = await Reaction.findByPk(reaction.reactionId, {
            include: {
                model: User,
                as: 'user',
                attributes: ['userId', 'username', 'displayName', 'avatarUrl']
            }
        });
        
        // Emit socket event for real-time update
        // io.to(`channel:${message.channelId}`).emit('new_reaction', reactionWithUser);
        
        res.status(201).json(reactionWithUser);
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ error: 'An error occurred while adding the reaction' });
    }
};

/**
 * Remove a reaction from a message
 * @route DELETE /api/messages/:messageId/reactions/:reactionId
 */
const removeReaction = async (req, res) => {
    try {
        const { messageId, reactionId } = req.params;
        
        // Find the reaction
        const reaction = await Reaction.findOne({
            where: {
                reactionId,
                messageId
            },
            include: [{
                model: Message,
                as: 'message',
                include: [{
                    model: Channel,
                    as: 'channel',
                    attributes: ['channelId']
                }]
            }]
        });
        
        if (!reaction) {
            return res.status(404).json({ error: 'Reaction not found' });
        }
        
        // Check if user is the one who added the reaction
        if (reaction.userId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only remove your own reactions' });
        }
        
        // Store channel ID for socket event before deleting
        const channelId = reaction.message.channel.channelId;
        
        // Delete the reaction
        await reaction.destroy();
        
        // Emit socket event for real-time update
        // io.to(`channel:${channelId}`).emit('reaction_removed', {
        //     reactionId,
        //     messageId
        // });
        
        res.json({ message: 'Reaction removed successfully' });
    } catch (error) {
        console.error('Error removing reaction:', error);
        res.status(500).json({ error: 'An error occurred while removing the reaction' });
    }
};

module.exports = {
    getMessageById,
    createMessage,
    updateMessage,
    deleteMessage,
    createThreadReply,
    getThreadReplies,
    addReaction,
    removeReaction
};
