const {
    Mention,
    User,
    Message,
    DirectMessage,
    Channel,
    sequelize
} = require('../models');
const { Op } = require('sequelize');

/**
 * Get mentions for the current user
 * @route GET /api/users/me/mentions
 */
const getUserMentions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { unread, limit = 20, offset = 0 } = req.query;
        
        const whereClause = { userId };
        
        // Apply filter for unread mentions if requested
        if (unread === 'true') {
            whereClause.isRead = false;
        }
        
        const mentions = await Mention.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Message,
                    as: 'message',
                    include: [
                        {
                            model: User,
                            as: 'sender',
                            attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                        },
                        {
                            model: Channel,
                            as: 'channel',
                            attributes: ['channelId', 'name']
                        }
                    ]
                },
                {
                    model: DirectMessage,
                    as: 'directMessage',
                    include: [
                        {
                            model: User,
                            as: 'sender',
                            attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'mentionedUser',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                }
            ]
        });
        
        res.json({
            mentions: mentions.rows,
            total: mentions.count,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        });
    } catch (error) {
        console.error('Error getting user mentions:', error);
        res.status(500).json({ error: 'An error occurred while fetching mentions' });
    }
};

/**
 * Get a specific mention by ID
 * @route GET /api/mentions/:mentionId
 */
const getMentionById = async (req, res) => {
    try {
        const { mentionId } = req.params;
        const userId = req.user.userId;
        
        const mention = await Mention.findOne({
            where: {
                mentionId,
                userId
            },
            include: [
                {
                    model: Message,
                    as: 'message',
                    include: [
                        {
                            model: User,
                            as: 'sender',
                            attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                        },
                        {
                            model: Channel,
                            as: 'channel',
                            attributes: ['channelId', 'name']
                        }
                    ]
                },
                {
                    model: DirectMessage,
                    as: 'directMessage',
                    include: [
                        {
                            model: User,
                            as: 'sender',
                            attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'mentionedUser',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                }
            ]
        });
        
        if (!mention) {
            return res.status(404).json({ error: 'Mention not found' });
        }
        
        res.json(mention);
    } catch (error) {
        console.error('Error getting mention:', error);
        res.status(500).json({ error: 'An error occurred while fetching the mention' });
    }
};

/**
 * Mark a mention as read
 * @route PATCH /api/mentions/:mentionId/read
 */
const markMentionAsRead = async (req, res) => {
    try {
        const { mentionId } = req.params;
        const userId = req.user.userId;
        
        const mention = await Mention.findOne({
            where: {
                mentionId,
                userId
            }
        });
        
        if (!mention) {
            return res.status(404).json({ error: 'Mention not found' });
        }
        
        mention.isRead = true;
        await mention.save();
        
        res.json({ message: 'Mention marked as read', mention });
    } catch (error) {
        console.error('Error marking mention as read:', error);
        res.status(500).json({ error: 'An error occurred while updating the mention' });
    }
};

/**
 * Mark all mentions as read for the current user
 * @route PATCH /api/mentions/read-all
 */
const markAllMentionsAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        await Mention.update(
            { isRead: true },
            {
                where: {
                    userId,
                    isRead: false
                }
            }
        );
        
        res.json({ message: 'All mentions marked as read' });
    } catch (error) {
        console.error('Error marking all mentions as read:', error);
        res.status(500).json({ error: 'An error occurred while updating mentions' });
    }
};

/**
 * Count unread mentions for the current user
 * @route GET /api/users/me/mentions/count
 */
const countUnreadMentions = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const count = await Mention.count({
            where: {
                userId
            }
        });
        
        res.json({ count });
    } catch (error) {
        console.error('Error counting unread mentions:', error);
        res.status(500).json({ error: 'An error occurred while counting unread mentions' });
    }
};

module.exports = {
    getUserMentions,
    getMentionById,
    markMentionAsRead,
    markAllMentionsAsRead,
    countUnreadMentions
}; 