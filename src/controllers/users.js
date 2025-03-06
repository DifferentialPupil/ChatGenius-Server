const { User, UserStatus, NotificationPreference, AIAvatar, AICommunicationHistory, Conversation, ConversationParticipant, DirectMessage } = require('../models')
const Models = require('../models')
const { Op } = require('sequelize')

// Get all users with pagination and filtering
const getAllUsers = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            workspaceId = null 
        } = req.query

        const offset = (page - 1) * limit
        
        // Build query conditions
        const whereCondition = {}
        
        // Add search if provided
        if (search) {
            whereCondition[Op.or] = [
                { username: { [Op.iLike]: `%${search}%` } },
                { display_name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ]
        }
        
        // If workspaceId is provided, we need to filter users by workspace
        let userIds = null
        if (workspaceId) {
            // This would require a join with workspace_members
            // Assuming we have a WorkspaceMember model
            const workspaceMembers = await WorkspaceMember.findAll({
                where: { workspace_id: workspaceId },
                attributes: ['user_id']
            })
            userIds = workspaceMembers.map(member => member.user_id)
            whereCondition.user_id = { [Op.in]: userIds }
        }

        // Get users with pagination
        const { count, rows: users } = await User.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: offset,
            order: [['created_at', 'DESC']]
        })

        res.json({
            users,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        })
    } catch (error) {
        next(error)
    }
}

// Get current user (me) with related data
const getCurrentUser = async (req, res, next) => {
    try {
        // Use the user object directly from the request
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        res.json(req.user)
    } catch (error) {
        next(error)
    }
}

// Update current user
const updateCurrentUser = async (req, res, next) => {
    try {
        // Use req.user to get the userId directly
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        // Update allowed fields only
        const allowedFields = ['display_name', 'avatar_url', 'username']
        const updates = {}
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field]
            }
        })
        
        // Update the user in the database using userId from req.user
        const [updatedRowCount] = await User.update(updates, {
            where: { user_id: req.user.userId }
        })
        
        if (updatedRowCount === 0) {
            return res.status(404).json({ message: 'User not found' })
        }
        
        // Get the updated user to return in the response
        const updatedUser = await User.findByPk(req.user.userId)
        
        res.json(updatedUser)
    } catch (error) {
        next(error)
    }
}

// Update user status
const updateUserStatus = async (req, res, next) => {
    try {
        // Use req.user to get the userId directly
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        // Find or create status using userId from req.user
        const [userStatus, created] = await UserStatus.findOrCreate({
            where: { user_id: req.user.userId },
            defaults: {
                status_text: req.body.statusText,
                expires_at: req.body.expiresAt || null
            }
        })
        
        // If status exists, update it
        if (!created) {
            await userStatus.update({
                status_text: req.body.statusText,
                expires_at: req.body.expiresAt || null
            })
        }
        
        res.json(userStatus)
    } catch (error) {
        next(error)
    }
}

// Delete user (soft delete or just for admins)
const deleteUser = async (req, res, next) => {
    try {
        // This would typically be restricted to admins or the user themselves
        const user = await User.findByPk(req.params.id)
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }
        
        // Check permissions - example only
        // if (req.user.role !== 'admin' && req.user.sub !== user.auth0_id) {
        //    return res.status(403).json({ message: 'Not authorized' })
        // }
        
        await user.destroy()
        
        res.status(204).end()
    } catch (error) {
        next(error)
    }
}

// Get user notification preferences
const getUserNotificationPreferences = async (req, res, next) => {
    try {
        // Use req.user to get the userId directly
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        const preferences = await NotificationPreference.findOne({
            where: { user_id: req.user.userId }
        })
        
        if (!preferences) {
            // Create default preferences if they don't exist
            const defaultPreferences = await NotificationPreference.create({
                user_id: req.user.userId,
                notify_on_direct_message: true,
                notify_on_channel_message: true,
                notify_on_mention: true,
                sound_enabled: true,
                desktop_notifications_enabled: true
            })
            
            return res.json(defaultPreferences)
        }
        
        res.json(preferences)
    } catch (error) {
        next(error)
    }
}

// Update notification preferences
const updateNotificationPreferences = async (req, res, next) => {
    try {
        // Use req.user to get the userId directly
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        const [preferences, created] = await NotificationPreference.findOrCreate({
            where: { user_id: req.user.userId },
            defaults: {
                notify_on_direct_message: req.body.notifyOnDirectMessage ?? true,
                notify_on_channel_message: req.body.notifyOnChannelMessage ?? true,
                notify_on_mention: req.body.notifyOnMention ?? true,
                sound_enabled: req.body.soundEnabled ?? true,
                desktop_notifications_enabled: req.body.desktopNotificationsEnabled ?? true
            }
        })
        
        if (!created) {
            // Update existing preferences
            const updates = {}
            
            if (req.body.notifyOnDirectMessage !== undefined) {
                updates.notify_on_direct_message = req.body.notifyOnDirectMessage
            }
            
            if (req.body.notifyOnChannelMessage !== undefined) {
                updates.notify_on_channel_message = req.body.notifyOnChannelMessage
            }
            
            if (req.body.notifyOnMention !== undefined) {
                updates.notify_on_mention = req.body.notifyOnMention
            }
            
            if (req.body.soundEnabled !== undefined) {
                updates.sound_enabled = req.body.soundEnabled
            }
            
            if (req.body.desktopNotificationsEnabled !== undefined) {
                updates.desktop_notifications_enabled = req.body.desktopNotificationsEnabled
            }
            
            await preferences.update(updates)
        }
        
        res.json(preferences)
    } catch (error) {
        next(error)
    }
}

// Get user's direct message conversations
const getUserDirectMessages = async (req, res, next) => {
    try {
        // Use req.user to get the userId directly
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        // Extract pagination parameters from query
        const { 
            page = 1, 
            limit = 20
        } = req.query
        
        // Calculate offset for pagination
        const offset = (parseInt(page) - 1) * parseInt(limit)
        
        // First find all conversation IDs where the user is a participant
        const participantRecords = await ConversationParticipant.findAll({
            where: { user_id: req.user.userId },
            attributes: ['conversation_id']
        });
        
        const conversationIds = participantRecords.map(record => record.conversation_id);
        
        if (conversationIds.length === 0) {
            // If user has no conversations, return empty result
            return res.json({
                conversations: [],
                pagination: {
                    total: 0,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: 0
                }
            });
        }
        
        // Now query the conversations with these IDs
        const { count, rows: conversations } = await Conversation.findAndCountAll({
            where: {
                conversation_id: {
                    [Op.in]: conversationIds
                }
            },
            include: [
                {
                    model: User,
                    as: 'participants', // This matches the association in Conversation model
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url'],
                    through: { attributes: [] } // Exclude join table attributes
                },
                {
                    model: DirectMessage,
                    as: 'messages', // This matches the association in Conversation model
                    limit: 1,
                    order: [['created_at', 'DESC']],
                    separate: true, // Use a separate query to get the last message
                    include: [{
                        model: User,
                        as: 'sender',
                        attributes: ['user_id', 'username', 'display_name', 'avatar_url']
                    }]
                }
            ],
            order: [['updated_at', 'DESC']],
            limit: parseInt(limit),
            offset: offset,
            distinct: true // Ensures count is accurate with associations
        });
        
        // Process the results to have a cleaner response format
        const processedConversations = conversations.map(conversation => {
            const lastMessage = conversation.messages && conversation.messages.length > 0 
                ? conversation.messages[0] 
                : null;
                
            return {
                conversationId: conversation.conversationId,
                participants: conversation.participants,
                lastMessage: lastMessage,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt
            };
        });
        
        // Return conversations with pagination metadata
        res.json({
            conversations: processedConversations,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
}

const getUserById = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }
        res.json(user)
    } catch (error) {
        next(error)
    }
}

const getUserByAuth0Id = async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { auth0_id: req.params.auth0id } })
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }
        res.json(user)
    } catch (error) {
        next(error)
    }
}

const createUser = async (req, res, next) => {
    try {
        const user = await User.create({
            auth0_id: req.body.auth0id,
            username: req.body.username,
            display_name: req.body.displayname,
            email: req.body.email,
            avatar_url: req.body.avatarurl
        })
        res.status(201).json(user)
    } catch (error) {
        next(error)
    }
}

const findUserByDisplayName = async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { display_name: req.params.displayname } })
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }
        res.json(user)
    } catch (error) {
        next(error)
    }
}

// AI Avatar methods

// Get user's AI avatar
const getUserAvatar = async (req, res, next) => {
    try {
        // Use req.user to get the userId directly
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        const avatar = await Models.Avatar.findOne({
            where: { user_id: req.user.userId }
        })
        
        if (!avatar) {
            return res.status(404).json({ message: 'AI avatar not found' })
        }
        
        res.json(avatar)
    } catch (error) {
        next(error)
    }
}

// Create user's AI avatar
const createUserAvatar = async (req, res, next) => {
    try {
        // Use req.user to get the userId directly
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        // Check if avatar already exists
        const existingAvatar = await AIAvatar.findOne({
            where: { user_id: req.user.userId }
        })
        
        if (existingAvatar) {
            return res.status(409).json({ message: 'AI avatar already exists' })
        }
        
        // Create new avatar
        const avatar = await AIAvatar.create({
            user_id: req.user.userId,
            ready_player_me_url: req.body.readyPlayerMeUrl,
            voice_id: req.body.voiceId,
            video_style_id: req.body.videoStyleId,
            autonomy_level: req.body.autonomyLevel || 'manual',
            data_retention_policy: req.body.dataRetentionPolicy || '30_days',
            appearance_customization: req.body.appearanceCustomization || {},
            uses_gestures: req.body.usesGestures || false,
            voice_enabled: req.body.voiceEnabled || false,
            video_enabled: req.body.videoEnabled || false
        })
        
        res.status(201).json(avatar)
    } catch (error) {
        next(error)
    }
}

// Update user's AI avatar
const updateUserAvatar = async (req, res, next) => {
    try {
        // Use req.user to get the userId directly
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        // Find avatar
        const avatar = await Models.Avatar.findOne({
            where: { user_id: req.user.userId }
        })
        
        if (!avatar) {
            return res.status(404).json({ message: 'AI avatar not found' })
        }
        
        // Update fields
        const updates = {}
        const allowedFields = [
            'ready_player_me_url',
            'voice_id',
            'video_style_id',
            'autonomy_level',
            'data_retention_policy',
            'appearance_customization',
            'uses_gestures',
            'voice_enabled',
            'video_enabled'
        ]
        
        // Map request body fields to database fields
        const fieldMapping = {
            readyPlayerMeUrl: 'ready_player_me_url',
            voiceId: 'voice_id',
            videoStyleId: 'video_style_id',
            autonomyLevel: 'autonomy_level',
            dataRetentionPolicy: 'data_retention_policy',
            appearanceCustomization: 'appearance_customization',
            usesGestures: 'uses_gestures',
            voiceEnabled: 'voice_enabled',
            videoEnabled: 'video_enabled'
        }
        
        // Build updates object
        Object.keys(req.body).forEach(key => {
            const dbField = fieldMapping[key]
            if (dbField && allowedFields.includes(dbField)) {
                updates[dbField] = req.body[key]
            }
        })
        
        await avatar.update(updates)
        
        res.json(avatar)
    } catch (error) {
        next(error)
    }
}

// Get AI avatar communication history
const getAvatarCommunicationHistory = async (req, res, next) => {
    try {
        // Use req.user to get the userId directly
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        // Find avatar
        const avatar = await Models.Avatar.findOne({
            where: { user_id: req.user.userId }
        })

        console.log(avatar)
        
        if (!avatar) {
            return res.status(404).json({ message: 'AI avatar not found' })
        }
        
        // Get history with pagination
        const { 
            page = 1, 
            limit = 20,
            type = null,
        } = req.query
        
        const offset = (page - 1) * limit
        
        // Build query conditions
        const whereCondition = { avatar_id: avatar.dataValues.avatarId }
        
        if (type) {
            whereCondition.type = type
        }
        
        const { count, rows: history } = await Models.CommunicationHistory.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: offset,
            order: [['timestamp', 'DESC']]
        })
        
        res.json({
            history,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        })
    } catch (error) {
        next(error)
    }
}

// Provide feedback on AI communication
const provideFeedback = async (req, res, next) => {
    try {
        const { communicationId, feedback } = req.body
        
        if (!communicationId || !feedback) {
            return res.status(400).json({ message: 'Communication ID and feedback are required' })
        }
        
        // Use req.user to get the userId directly
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        // Find the communication history entry
        const communication = await Models.CommunicationHistory.findByPk(communicationId)
        
        if (!communication) {
            return res.status(404).json({ message: 'Communication history not found' })
        }
        
        // Find avatar to verify ownership
        const avatar = await Models.Avatar.findByPk(communication.avatar_id)
        
        if (!avatar || avatar.user_id !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to provide feedback on this communication' })
        }
        
        // Update feedback
        await communication.update({ feedback })
        
        res.json(communication)
    } catch (error) {
        next(error)
    }
}

// Send message using AI avatar
const sendAIMessage = async (req, res, next) => {
    try {
        const { prompt, channelId, recipientId } = req.body
        
        if (!prompt || (!channelId && !recipientId)) {
            return res.status(400).json({ 
                message: 'Prompt and either channelId or recipientId are required' 
            })
        }
        
        // Use req.user to get the userId directly
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }
        
        // Find avatar
        const avatar = await Models.Avatar.findOne({
            where: { user_id: req.user.userId }
        })
        
        if (!avatar) {
            return res.status(404).json({ message: 'AI avatar not found' })
        }
        
        // In a real implementation, you would:
        // 1. Process the prompt using an AI service
        // 2. Generate a response
        // 3. Send the message to the channel or recipient
        // 4. Record the communication history
        
        // Dummy implementation for this example:
        const response = `AI response to: ${prompt}`
        
        // Record communication history
        const communicationType = channelId ? 'channel_message' : 'direct_message'
        
        const communicationHistory = await AICommunicationHistory.create({
            avatar_id: avatar.avatar_id,
            type: communicationType,
            prompt,
            response,
            context_slack_conversation: {} // This would have relevant context in real implementation
        })
        
        // In reality, you would also:
        // 1. Send a message to the channel or direct message
        // 2. Handle voice/video synthesis if enabled
        
        res.json({
            success: true,
            communicationId: communicationHistory.communication_id,
            response
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    getUserByAuth0Id,
    createUser,
    findUserByDisplayName,
    getCurrentUser,
    updateCurrentUser,
    updateUserStatus,
    deleteUser,
    getUserNotificationPreferences,
    updateNotificationPreferences,
    getUserDirectMessages,
    // AI Avatar functions
    getUserAvatar,
    createUserAvatar,
    updateUserAvatar,
    getAvatarCommunicationHistory,
    provideFeedback,
    sendAIMessage
}