const { Op } = require('sequelize');
const { 
    DirectMessage, 
    User, 
    Conversation, 
    ConversationParticipant, 
    Reaction, 
    File, 
    Mention, 
    UserNotification,
    sequelize 
} = require('../models');
// const io = require('../socket'); // Assuming socket.io is set up in this file

/**
 * Get direct message by ID
 * @route GET /api/directmessages/:directMessageId
 */
const getDirectMessageById = async (req, res) => {
    try {
        const { directMessageId } = req.params;
        
        const directMessage = await DirectMessage.findOne({
            where: { 
                directMessageId,
                isDeleted: false 
            },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                },
                {
                    model: Conversation,
                    as: 'conversation',
                    include: [
                        {
                            model: User,
                            as: 'participants',
                            attributes: ['userId', 'username', 'displayName', 'avatarUrl'],
                            through: { attributes: [] } // Don't include junction table
                        }
                    ]
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
        
        if (!directMessage) {
            return res.status(404).json({ error: 'Direct message not found' });
        }
        
        // Check if user is a participant in this conversation
        const isParticipant = directMessage.conversation.participants.some(
            participant => participant.userId === req.user.userId
        );
        
        if (!isParticipant) {
            return res.status(403).json({ error: 'You do not have access to this message' });
        }
        
        res.json(directMessage);
    } catch (error) {
        console.error('Error fetching direct message:', error);
        res.status(500).json({ error: 'An error occurred while fetching the direct message' });
    }
};

/**
 * Send a direct message to a user
 * @route POST /api/directmessages/:recipientId
 */
const sendDirectMessage = async (req, res) => {
    try {
        const { recipientId } = req.params;
        const { content } = req.body;
        const senderId = req.user.userId;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content cannot be empty' });
        }
        
        // Verify recipient exists
        const recipient = await User.findByPk(recipientId);
        if (!recipient) {
            return res.status(404).json({ error: 'Recipient not found' });
        }
        
        // Don't allow sending messages to yourself
        if (senderId === recipientId) {
            return res.status(400).json({ error: 'Cannot send direct message to yourself' });
        }
        
        // Find a conversation where both users are participants
        // Use a raw query approach to avoid the complex joins that are causing SQL errors
        const conversations = await sequelize.query(`
            SELECT c.conversation_id 
            FROM messaging.conversations c
            WHERE EXISTS (
                SELECT 1 FROM messaging.conversation_participants cp1
                WHERE cp1.conversation_id = c.conversation_id
                AND cp1.user_id = :senderId
            )
            AND EXISTS (
                SELECT 1 FROM messaging.conversation_participants cp2
                WHERE cp2.conversation_id = c.conversation_id
                AND cp2.user_id = :recipientId
            )
            AND (
                SELECT COUNT(DISTINCT cp3.user_id)
                FROM messaging.conversation_participants cp3
                WHERE cp3.conversation_id = c.conversation_id
            ) = 2
        `, {
            replacements: { senderId, recipientId },
            type: sequelize.QueryTypes.SELECT
        });
        
        let conversation;
        
        // If no conversation exists, create one
        if (conversations.length === 0) {
            // Create a new conversation
            conversation = await Conversation.create({});
            
            // Add both users as participants
            await ConversationParticipant.bulkCreate([
                { conversationId: conversation.conversationId, userId: senderId },
                { conversationId: conversation.conversationId, userId: recipientId }
            ]);
        } else {
            // Get the existing conversation
            conversation = await Conversation.findByPk(conversations[0].conversation_id);
        }
        
        // Create the direct message
        const directMessage = await DirectMessage.create({
            conversationId: conversation.conversationId,
            senderId,
            content
        });
        
        // Process mentions if any
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
                    directMessageId: directMessage.directMessageId,
                    userId: user.userId
                });
                
                // Create notification for the mentioned user (implementation would depend on your notification system)
            }
        }
        
        // Create notification for the recipient
        await UserNotification.create({
            userId: recipientId,
            directMessageId: directMessage.directMessageId,
            type: 'DIRECT_MESSAGE',
            content: `${req.user.displayName} sent you a message`,
            isRead: false
        });
        
        // Fetch the created message with associations for the response
        const messageWithAssociations = await DirectMessage.findByPk(directMessage.directMessageId, {
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                }
            ]
        });
        
        // Emit socket event for real-time update
        // io.to(`user:${recipientId}`).emit('new_direct_message', messageWithAssociations);
        
        res.status(201).json(messageWithAssociations);
    } catch (error) {
        console.error('Error sending direct message:', error);
        res.status(500).json({ error: 'An error occurred while sending the direct message' });
    }
};

/**
 * Get all direct message conversations for the current user
 * @route GET /api/directmessages/me
 */
const getUserConversations = async (req, res) => {
    try {
        const { limit = 50, before } = req.query;
        const userId = req.user.userId;
        
        // Step 1: Get all conversation IDs where the user is a participant
        const userConversations = await ConversationParticipant.findAll({
            where: { userId },
            attributes: ['conversationId']
        });
        
        if (userConversations.length === 0) {
            return res.json([]);
        }
        
        const conversationIds = userConversations.map(c => c.conversationId);
        
        // Step 2: Get conversations with other participants and latest messages
        const conversations = await Conversation.findAll({
            include: [
                {
                    model: User,
                    as: 'participants',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl', 'status'],
                    through: { attributes: [] }
                },
                {
                    model: DirectMessage,
                    as: 'messages',
                    where: { 
                        isDeleted: false 
                    },
                    required: false,
                    separate: true,
                    order: [['created_at', 'DESC']],
                    limit: 1, // Most recent message
                    include: [
                        {
                            model: User,
                            as: 'sender',
                            attributes: ['userId', 'username', 'displayName']
                        }
                    ]
                }
            ],
            where: {
                conversationId: {
                    [Op.in]: conversationIds
                }
            },
            limit: parseInt(limit, 10)
        });
        
        // Format response to provide a useful structure for the client
        const formattedConversations = [];
        
        for (const conversation of conversations) {
            // Filter out current user from participants
            const otherParticipants = conversation.participants.filter(
                participant => participant.userId !== userId
            );
            
            // Skip conversations with no other participants (shouldn't happen normally)
            if (otherParticipants.length === 0) continue;
            
            // Get the other participant in the conversation
            const otherParticipant = otherParticipants[0];
            
            // Get latest message if any
            const latestMessage = conversation.messages.length > 0 ? conversation.messages[0] : null;
            
            formattedConversations.push({
                conversationId: conversation.conversationId,
                participant: otherParticipant,
                latestMessage,
                updatedAt: latestMessage ? latestMessage.createdAt : conversation.createdAt
            });
        }
        
        // Sort by latest message timestamp
        formattedConversations.sort((a, b) => {
            const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt) : new Date(a.updatedAt);
            const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt) : new Date(b.updatedAt);
            return bTime - aTime; // Descending order
        });
        
        res.json(formattedConversations);
    } catch (error) {
        console.error('Error fetching user conversations:', error);
        res.status(500).json({ error: 'An error occurred while fetching conversations' });
    }
};

/**
 * Get messages in a conversation with another user
 * @route GET /api/directmessages/conversations/:userId
 */
const getConversationMessages = async (req, res) => {
    try {
        const { userId } = req.params; // The other user's ID
        const { limit = 50, before, after } = req.query;
        const currentUserId = req.user.userId;
        
        // Verify the other user exists
        const otherUser = await User.findByPk(userId);
        if (!otherUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Find conversation between current user and the specified user using raw SQL
        const conversations = await sequelize.query(`
            SELECT c.conversation_id 
            FROM messaging.conversations c
            WHERE EXISTS (
                SELECT 1 FROM messaging.conversation_participants cp1
                WHERE cp1.conversation_id = c.conversation_id
                AND cp1.user_id = :currentUserId
            )
            AND EXISTS (
                SELECT 1 FROM messaging.conversation_participants cp2
                WHERE cp2.conversation_id = c.conversation_id
                AND cp2.user_id = :otherUserId
            )
            AND (
                SELECT COUNT(DISTINCT cp3.user_id)
                FROM messaging.conversation_participants cp3
                WHERE cp3.conversation_id = c.conversation_id
            ) = 2
        `, {
            replacements: { currentUserId, otherUserId: userId },
            type: sequelize.QueryTypes.SELECT
        });
        
        if (conversations.length === 0) {
            // No conversation exists yet
            return res.json([]);
        }
        
        const conversationId = conversations[0].conversation_id;
        
        // Build query conditions for pagination
        const where = { 
            conversationId,
            isDeleted: false
        };
        
        if (before) {
            where.created_at = { [Op.lt]: new Date(before) };
        } else if (after) {
            where.created_at = { [Op.gt]: new Date(after) };
        }
        
        // Fetch messages with pagination
        const messages = await DirectMessage.findAll({
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
        const result = before ? messages.reverse() : messages;
        
        // Mark any unread messages as read
        await UserNotification.update(
            { isRead: true },
            {
                where: {
                    userId: req.user.userId,
                    directMessageId: {
                        [Op.in]: result.map(message => message.directMessageId)
                    },
                    isRead: false
                }
            }
        );
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching conversation messages:', error);
        res.status(500).json({ error: 'An error occurred while fetching messages' });
    }
};

/**
 * Update a direct message
 * @route PATCH /api/directmessages/:directMessageId
 */
const updateDirectMessage = async (req, res) => {
    try {
        const { directMessageId } = req.params;
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content cannot be empty' });
        }
        
        // Find the message
        const directMessage = await DirectMessage.findByPk(directMessageId, {
            include: [{
                model: Conversation,
                as: 'conversation',
                include: [
                    {
                        model: User,
                        as: 'participants',
                        attributes: ['userId'],
                        through: { attributes: [] }
                    }
                ]
            }]
        });
        
        if (!directMessage) {
            return res.status(404).json({ error: 'Direct message not found' });
        }
        
        // Check if user is the sender of the message
        if (directMessage.senderId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only edit your own messages' });
        }
        
        // Check if message is deleted
        if (directMessage.isDeleted) {
            return res.status(400).json({ error: 'Cannot edit a deleted message' });
        }
        
        // Update the message
        await directMessage.update({
            content,
            isEdited: true
        });
        
        // Process mentions if any
        const mentionRegex = /@(\w+)/g;
        const mentions = content.match(mentionRegex);
        
        if (mentions) {
            // Remove existing mentions
            await Mention.destroy({ where: { directMessageId } });
            
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
                    directMessageId,
                    userId: user.userId
                });
                
                // Create notification for the mentioned user if needed
            }
        }
        
        // Fetch the updated message with associations for the response
        const updatedMessage = await DirectMessage.findByPk(directMessageId, {
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
        // const participants = directMessage.conversation.participants.map(p => p.userId);
        // participants.forEach(participantId => {
        //     io.to(`user:${participantId}`).emit('direct_message_updated', updatedMessage);
        // });
        
        res.json(updatedMessage);
    } catch (error) {
        console.error('Error updating direct message:', error);
        res.status(500).json({ error: 'An error occurred while updating the direct message' });
    }
};

/**
 * Delete a direct message (soft delete)
 * @route DELETE /api/directmessages/:directMessageId
 */
const deleteDirectMessage = async (req, res) => {
    try {
        const { directMessageId } = req.params;
        
        // Find the message
        const directMessage = await DirectMessage.findByPk(directMessageId, {
            include: [{
                model: Conversation,
                as: 'conversation',
                include: [
                    {
                        model: User,
                        as: 'participants',
                        attributes: ['userId'],
                        through: { attributes: [] }
                    }
                ]
            }]
        });
        
        if (!directMessage) {
            return res.status(404).json({ error: 'Direct message not found' });
        }
        
        // Check if user is the sender of the message
        if (directMessage.senderId !== req.user.userId) {
            // Only the sender can delete the message
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }
        
        // Soft delete the message
        await directMessage.update({ isDeleted: true });
        
        // Emit socket event for real-time update
        // const participants = directMessage.conversation.participants.map(p => p.userId);
        // participants.forEach(participantId => {
        //     io.to(`user:${participantId}`).emit('direct_message_deleted', {
        //         directMessageId,
        //         conversationId: directMessage.conversationId
        //     });
        // });
        
        res.json({ message: 'Direct message deleted successfully' });
    } catch (error) {
        console.error('Error deleting direct message:', error);
        res.status(500).json({ error: 'An error occurred while deleting the direct message' });
    }
};

/**
 * Add a reaction to a direct message
 * @route POST /api/directmessages/:directMessageId/reactions
 */
const addReaction = async (req, res) => {
    try {
        const { directMessageId } = req.params;
        const { emoji } = req.body;
        
        if (!emoji) {
            return res.status(400).json({ error: 'Emoji is required' });
        }
        
        // Find the direct message
        const directMessage = await DirectMessage.findByPk(directMessageId, {
            include: [{
                model: Conversation,
                as: 'conversation',
                include: [
                    {
                        model: User,
                        as: 'participants',
                        attributes: ['userId'],
                        through: { attributes: [] }
                    }
                ]
            }]
        });
        
        if (!directMessage) {
            return res.status(404).json({ error: 'Direct message not found' });
        }
        
        // Check if the user is a participant in this conversation
        const isParticipant = directMessage.conversation.participants.some(
            participant => participant.userId === req.user.userId
        );
        
        if (!isParticipant) {
            return res.status(403).json({ error: 'You do not have access to this message' });
        }
        
        // Check if user already reacted with the same emoji
        const existingReaction = await Reaction.findOne({
            where: {
                directMessageId,
                userId: req.user.userId,
                emoji
            }
        });
        
        if (existingReaction) {
            return res.status(409).json({ error: 'You already reacted with this emoji' });
        }
        
        // Create the reaction
        const reaction = await Reaction.create({
            directMessageId,
            messageId: null,
            userId: req.user.userId,
            emoji
        });
        
        // Fetch the created reaction with user information
        const reactionWithUser = await Reaction.findByPk(reaction.reactionId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                }
            ]
        });
        
        // Emit socket event for real-time update
        // const participants = directMessage.conversation.participants.map(p => p.userId);
        // participants.forEach(participantId => {
        //     io.to(`user:${participantId}`).emit('new_reaction', {
        //         ...reactionWithUser.toJSON(),
        //         directMessageId
        //     });
        // });
        
        res.status(201).json(reactionWithUser);
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ error: 'An error occurred while adding the reaction' });
    }
};

/**
 * Remove a reaction from a direct message
 * @route DELETE /api/directmessages/:directMessageId/reactions/:reactionId
 */
const removeReaction = async (req, res) => {
    try {
        const { directMessageId, reactionId } = req.params;
        
        // Find the reaction
        const reaction = await Reaction.findOne({
            where: {
                reactionId,
                directMessageId
            },
            include: [{
                model: DirectMessage,
                as: 'directMessage',
                include: [{
                    model: Conversation,
                    as: 'conversation',
                    include: [
                        {
                            model: User,
                            as: 'participants',
                            attributes: ['userId'],
                            through: { attributes: [] }
                        }
                    ]
                }]
            }]
        });
        
        if (!reaction) {
            return res.status(404).json({ error: 'Reaction not found' });
        }
        
        // Check if user owns the reaction
        if (reaction.userId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only remove your own reactions' });
        }
        
        // Store reaction data before deletion for socket event
        const reactionData = {
            reactionId: reaction.reactionId,
            directMessageId: reaction.directMessageId,
            emoji: reaction.emoji,
            userId: reaction.userId
        };
        
        // Delete the reaction
        await reaction.destroy();
        
        // Emit socket event for real-time update
        // const participants = reaction.directMessage.conversation.participants.map(p => p.userId);
        // participants.forEach(participantId => {
        //     io.to(`user:${participantId}`).emit('reaction_removed', reactionData);
        // });
        
        res.json({ message: 'Reaction removed successfully' });
    } catch (error) {
        console.error('Error removing reaction:', error);
        res.status(500).json({ error: 'An error occurred while removing the reaction' });
    }
};

module.exports = {
    getDirectMessageById,
    sendDirectMessage,
    getUserConversations,
    getConversationMessages,
    updateDirectMessage,
    deleteDirectMessage,
    addReaction,
    removeReaction
}; 