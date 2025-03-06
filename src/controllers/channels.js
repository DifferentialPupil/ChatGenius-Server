const { 
    Channel, 
    ChannelMember, 
    User, 
    Message, 
    PinnedItem,
    Reaction,
    File,
    Workspace,
    sequelize
} = require('../models');
const { Op } = require('sequelize');

/**
 * Get all channels in a workspace
 * @route GET /api/workspaces/:workspaceId/channels
 */
const getAllWorkspaceChannels = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        
        // Verify workspace exists
        const workspace = await Workspace.findByPk(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        
        // Get channels that are either public or the user is a member of
        const channels = await Channel.findAll({
            where: {
                workspaceId,
                [Op.or]: [
                    { isPublic: true },
                    {
                        '$members.user_id$': req.user.userId
                    }
                ]
            },
            include: [
                {
                    model: ChannelMember,
                    as: 'members',
                    required: false
                }
            ]
        });
        
        res.json(channels);
    } catch (error) {
        console.error('Error fetching workspace channels:', error);
        res.status(500).json({ error: 'An error occurred while fetching workspace channels' });
    }
};

/**
 * Get channel details
 * @route GET /api/channels/:channelId
 */
const getChannelById = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        
        const channel = await Channel.findByPk(channelId, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl']
                }
            ]
        });
        
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if user has access to this channel
        if (!channel.isPublic) {
            const isMember = await ChannelMember.findOne({
                where: {
                    channelId,
                    userId: req.user.userId
                }
            });
            
            if (!isMember) {
                return res.status(403).json({ error: 'You do not have access to this channel' });
            }
        }
        
        res.json(channel);
    } catch (error) {
        console.error('Error fetching channel details:', error);
        res.status(500).json({ error: 'An error occurred while fetching channel details' });
    }
};

/**
 * Create a new channel
 * @route POST /api/workspaces/:workspaceId/channels
 */
const createChannel = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const { name, description, isPublic, topic } = req.body;
        
        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Channel name is required' });
        }
        
        // Verify workspace exists
        const workspace = await Workspace.findByPk(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        
        // Check if channel name already exists in workspace
        const existingChannel = await Channel.findOne({
            where: {
                workspaceId,
                name
            }
        });
        
        if (existingChannel) {
            return res.status(400).json({ error: 'Channel name already exists in this workspace' });
        }
        
        // Use a transaction to create both the channel and channel member
        const result = await sequelize.transaction(async (t) => {
            // Create the channel
            const channel = await Channel.create({
                workspaceId,
                name,
                description: description || null,
                isPublic: isPublic !== undefined ? isPublic : true,
                topic: topic || null,
                createdByUserId: req.user.userId
            }, { transaction: t });
            
            // Add the creator as a member with 'admin' role
            await ChannelMember.create({
                channelId: channel.channelId,
                userId: req.user.userId,
                role: 'admin'
            }, { transaction: t });
            
            return channel;
        });
        
        // Emit socket event for real-time updates
        // if (socketUtil && typeof socketUtil.emitToWorkspace === 'function') {
        //     socketUtil.emitToWorkspace(workspaceId, 'channel_created', result);
        // }
        
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating channel:', error);
        res.status(500).json({ error: 'An error occurred while creating the channel' });
    }
};

/**
 * Update channel details
 * @route PATCH /api/channels/:channelId
 */
const updateChannel = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        const { name, description, isPublic, topic } = req.body;
        
        // Fetch the channel
        const channel = await Channel.findByPk(channelId);
        
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if user has permission to update the channel
        const channelMember = await ChannelMember.findOne({
            where: {
                channelId,
                userId: req.user.userId,
                role: {
                    [Op.in]: ['admin', 'owner']
                }
            }
        });
        
        if (!channelMember) {
            return res.status(403).json({ error: 'You do not have permission to update this channel' });
        }
        
        // Check if new name conflicts with existing channel names
        if (name && name !== channel.name) {
            const existingChannel = await Channel.findOne({
                where: {
                    workspaceId: channel.workspaceId,
                    name,
                    channelId: {
                        [Op.ne]: channelId
                    }
                }
            });
            
            if (existingChannel) {
                return res.status(400).json({ error: 'Channel name already exists in this workspace' });
            }
        }
        
        // Update the channel
        const updatedData = {};
        if (name) updatedData.name = name;
        if (description !== undefined) updatedData.description = description;
        if (isPublic !== undefined) updatedData.isPublic = isPublic;
        if (topic !== undefined) updatedData.topic = topic;
        
        await channel.update(updatedData);
        
        // Emit socket event for real-time updates
        socketUtil.emitToChannel(channelId, 'channel_updated', channel);
        
        res.json(channel);
    } catch (error) {
        console.error('Error updating channel:', error);
        res.status(500).json({ error: 'An error occurred while updating the channel' });
    }
};

/**
 * Delete a channel
 * @route DELETE /api/channels/:channelId
 */
const deleteChannel = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        
        // Fetch the channel
        const channel = await Channel.findByPk(channelId);
        
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if user has permission to delete the channel
        const channelMember = await ChannelMember.findOne({
            where: {
                channelId,
                userId: req.user.userId,
                role: {
                    [Op.in]: ['admin', 'owner']
                }
            }
        });
        
        if (!channelMember) {
            return res.status(403).json({ error: 'You do not have permission to delete this channel' });
        }
        
        const workspaceId = channel.workspaceId;
        
        // Delete the channel (cascade will delete related records)
        await channel.destroy();
        
        // Emit socket event for real-time updates
        socketUtil.emitToWorkspace(workspaceId, 'channel_deleted', { channelId });
        
        res.json({ success: true, message: 'Channel deleted successfully' });
    } catch (error) {
        console.error('Error deleting channel:', error);
        res.status(500).json({ error: 'An error occurred while deleting the channel' });
    }
};

/**
 * Get all channel members
 * @route GET /api/channels/:channelId/members
 */
const getChannelMembers = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        
        // Verify channel exists
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if user has access to this channel
        if (!channel.isPublic) {
            const isMember = await ChannelMember.findOne({
                where: {
                    channelId,
                    userId: req.user.userId
                }
            });
            
            if (!isMember) {
                return res.status(403).json({ error: 'You do not have access to this channel' });
            }
        }
        
        // Get all members with user details
        const members = await ChannelMember.findAll({
            where: { channelId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'username', 'displayName', 'avatarUrl', 'status']
                }
            ]
        });
        
        res.json(members.map(member => ({
            channelMemberId: member.channelMemberId,
            role: member.role,
            user: member.user
        })));
    } catch (error) {
        console.error('Error fetching channel members:', error);
        res.status(500).json({ error: 'An error occurred while fetching channel members' });
    }
};

/**
 * Add members to a channel
 * @route POST /api/channels/:channelId/members
 */
const addChannelMembers = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        const { userIds } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'User IDs array is required' });
        }
        
        // Fetch the channel
        const channel = await Channel.findByPk(channelId);
        
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if user has permission to add members
        const channelMember = await ChannelMember.findOne({
            where: {
                channelId,
                userId: req.user.userId,
                role: {
                    [Op.in]: ['admin', 'owner']
                }
            }
        });
        
        if (!channelMember && !channel.isPublic) {
            return res.status(403).json({ error: 'You do not have permission to add members to this channel' });
        }
        
        // Get existing members to avoid duplicates
        const existingMembers = await ChannelMember.findAll({
            where: {
                channelId,
                userId: {
                    [Op.in]: userIds
                }
            },
            attributes: ['userId']
        });
        
        const existingUserIds = existingMembers.map(member => member.userId);
        const newUserIds = userIds.filter(id => !existingUserIds.includes(id));
        
        // Create new members
        const newMembers = [];
        for (const userId of newUserIds) {
            // Verify user exists
            const user = await User.findByPk(userId);
            if (user) {
                const member = await ChannelMember.create({
                    channelId,
                    userId,
                    role: 'member'
                });
                
                newMembers.push(member);
                
                // Emit socket event for real-time updates
                // socketUtil.emitToUser(userId, 'channel_member_added', {
                //     channelId,
                //     userId,
                //     role: 'member'
                // });
            }
        }
        
        res.status(201).json({
            success: true,
            message: `${newMembers.length} members added successfully`,
            addedMembers: newMembers
        });
    } catch (error) {
        console.error('Error adding channel members:', error);
        res.status(500).json({ error: 'An error occurred while adding channel members' });
    }
};

/**
 * Remove a member from a channel
 * @route DELETE /api/channels/:channelId/members/:userId
 */
const removeChannelMember = async (req, res, next) => {
    try {
        const { channelId, userId } = req.params;
        
        // Fetch the channel
        const channel = await Channel.findByPk(channelId);
        
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // If user is removing themselves, they can do it regardless of role
        const isSelfRemoval = userId === req.user.userId;
        
        if (!isSelfRemoval) {
            // Check if requester has permission to remove members
            const requesterMember = await ChannelMember.findOne({
                where: {
                    channelId,
                    userId: req.user.userId,
                    role: {
                        [Op.in]: ['admin', 'owner']
                    }
                }
            });
            
            if (!requesterMember) {
                return res.status(403).json({ error: 'You do not have permission to remove members from this channel' });
            }
            
            // Check if target member has a higher role than requester
            const targetMember = await ChannelMember.findOne({
                where: {
                    channelId,
                    userId
                }
            });
            
            if (targetMember && targetMember.role === 'owner' && requesterMember.role !== 'owner') {
                return res.status(403).json({ error: 'You cannot remove an owner from the channel' });
            }
        }
        
        // Remove the member
        const numDeleted = await ChannelMember.destroy({
            where: {
                channelId,
                userId
            }
        });
        
        if (numDeleted === 0) {
            return res.status(404).json({ error: 'Member not found in channel' });
        }
        
        // Emit socket event for real-time updates
        // socketUtil.emitToChannel(channelId, 'channel_member_removed', { channelId, userId });
        // socketUtil.emitToUser(userId, 'channel_member_removed', { channelId, userId });
        
        res.json({ success: true, message: 'Member removed from channel successfully' });
    } catch (error) {
        console.error('Error removing channel member:', error);
        res.status(500).json({ error: 'An error occurred while removing channel member' });
    }
};

/**
 * Join a public channel
 * @route POST /api/channels/:channelId/join
 */
const joinChannel = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        
        // Fetch the channel
        const channel = await Channel.findByPk(channelId);
        
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if channel is public
        if (!channel.isPublic) {
            return res.status(403).json({ error: 'Cannot join a private channel without an invitation' });
        }
        
        // Check if user is already a member
        const existingMember = await ChannelMember.findOne({
            where: {
                channelId,
                userId: req.user.userId
            }
        });
        
        if (existingMember) {
            return res.status(400).json({ error: 'You are already a member of this channel' });
        }
        
        // Add user as member
        const member = await ChannelMember.create({
            channelId,
            userId: req.user.userId,
            role: 'member'
        });
        
        // Emit socket event for real-time updates
        socketUtil.emitToChannel(channelId, 'channel_member_added', {
            channelId,
            userId: req.user.userId,
            role: 'member'
        });
        
        res.status(201).json({
            success: true,
            message: 'Joined channel successfully',
            member
        });
    } catch (error) {
        console.error('Error joining channel:', error);
        res.status(500).json({ error: 'An error occurred while joining the channel' });
    }
};

/**
 * Leave a channel
 * @route DELETE /api/channels/:channelId/leave
 */
const leaveChannel = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        
        // Fetch the channel
        const channel = await Channel.findByPk(channelId);
        
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if user is a member
        const member = await ChannelMember.findOne({
            where: {
                channelId,
                userId: req.user.userId
            }
        });
        
        if (!member) {
            return res.status(400).json({ error: 'You are not a member of this channel' });
        }
        
        // Check if user is the only owner
        if (member.role === 'owner') {
            const ownerCount = await ChannelMember.count({
                where: {
                    channelId,
                    role: 'owner'
                }
            });
            
            if (ownerCount === 1) {
                return res.status(400).json({ error: 'You cannot leave the channel as you are the only owner. Please assign a new owner first.' });
            }
        }
        
        // Remove user from channel
        await member.destroy();
        
        // Emit socket event for real-time updates
        socketUtil.emitToChannel(channelId, 'channel_member_removed', { channelId, userId: req.user.userId });
        
        res.json({ success: true, message: 'Left channel successfully' });
    } catch (error) {
        console.error('Error leaving channel:', error);
        res.status(500).json({ error: 'An error occurred while leaving the channel' });
    }
};

/**
 * Get channel messages
 * @route GET /api/channels/:channelId/messages
 */
const getChannelMessages = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        const { limit = 50, before, after } = req.query;
        
        // Verify channel exists
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if user has access to this channel
        const isMember = await ChannelMember.findOne({
            where: {
                channelId,
                userId: req.user.userId
            }
        });
        
        if (!isMember && !channel.isPublic) {
            return res.status(403).json({ error: 'You do not have access to this channel' });
        }
        
        // Build query conditions
        const where = { 
            channelId,
            isDeleted: false,
            parentMessageId: null  // Only get top-level messages, not thread replies
        };
        
        if (before) {
            where.created_at = { [Op.lt]: new Date(before) };
        } else if (after) {
            where.created_at = { [Op.gt]: new Date(after) };
        }
        
        // Fetch messages with pagination
        const messages = await Message.findAll({
            where,
            limit: parseInt(limit, 10),
            order: before ? [['created_at', 'DESC']] : [['created_at', 'ASC']],
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url']
                },
                {
                    model: Reaction,
                    as: 'reactions',
                    include: {
                        model: User,
                        as: 'user',
                        attributes: ['user_id', 'username', 'display_name']
                    }
                },
                {
                    model: File,
                    as: 'files',
                    attributes: ['file_id', 'filename', 'file_url', 'file_size', 'mime_type']
                },
                {
                    model: Message,
                    as: 'replies',
                    attributes: ['message_id'],
                    required: false
                }
            ]
        });
        
        // If we queried in descending order, reverse for client
        const result = before ? messages.reverse() : messages;
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching channel messages:', error);
        res.status(500).json({ error: 'An error occurred while fetching channel messages' });
    }
};

/**
 * Get user's channels
 * @route GET /api/users/me/channels
 */
const getUserChannels = async (req, res, next) => {
    try {
        // Find all channels where user is a member
        const channelMembers = await ChannelMember.findAll({
            where: { userId: req.user.userId },
            include: [
                {
                    model: Channel,
                    as: 'channel',
                    include: [
                        {
                            model: User,
                            as: 'creator',
                            attributes: ['user_id', 'username', 'display_name', 'avatar_url']
                        }
                    ]
                }
            ]
        });
        
        const channels = channelMembers.map(member => ({
            ...member.channel.toJSON(),
            role: member.role
        }));
        
        res.json(channels);
    } catch (error) {
        console.error('Error fetching user channels:', error);
        res.status(500).json({ error: 'An error occurred while fetching user channels' });
    }
};

/**
 * Pin an item to a channel
 * @route POST /api/channels/:channelId/pins
 */
const pinItem = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        const { messageId, fileId } = req.body;
        
        if (!messageId && !fileId) {
            return res.status(400).json({ error: 'Either messageId or fileId must be provided' });
        }
        
        // Verify channel exists
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if user has access to this channel
        const isMember = await ChannelMember.findOne({
            where: {
                channelId,
                userId: req.user.userId
            }
        });
        
        if (!isMember) {
            return res.status(403).json({ error: 'You do not have access to this channel' });
        }
        
        // Check if item already pinned
        const existingPin = await PinnedItem.findOne({
            where: {
                channelId,
                [messageId ? 'messageId' : 'fileId']: messageId || fileId
            }
        });
        
        if (existingPin) {
            return res.status(400).json({ error: 'Item is already pinned to this channel' });
        }
        
        // Create the pinned item
        const pinnedItem = await PinnedItem.create({
            channelId,
            messageId: messageId || null,
            fileId: fileId || null,
            pinnedByUserId: req.user.userId
        });
        
        // Get full pinned item with related data
        const fullPinnedItem = await PinnedItem.findByPk(pinnedItem.pinnedItemId, {
            include: [
                {
                    model: User,
                    as: 'pinnedBy',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url']
                },
                {
                    model: Message,
                    as: 'message',
                    include: {
                        model: User,
                        as: 'sender',
                        attributes: ['user_id', 'username', 'display_name', 'avatar_url']
                    }
                },
                {
                    model: File,
                    as: 'file',
                    attributes: ['file_id', 'filename', 'file_url', 'file_size', 'mime_type']
                }
            ]
        });
        
        // Emit socket event for real-time updates
        socketUtil.emitToChannel(channelId, 'new_pin', fullPinnedItem);
        
        res.status(201).json(fullPinnedItem);
    } catch (error) {
        console.error('Error pinning item:', error);
        res.status(500).json({ error: 'An error occurred while pinning the item' });
    }
};

/**
 * Unpin an item from a channel
 * @route DELETE /api/channels/:channelId/pins/:pinnedItemId
 */
const unpinItem = async (req, res, next) => {
    try {
        const { channelId, pinnedItemId } = req.params;
        
        // Verify channel exists
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Find the pinned item
        const pinnedItem = await PinnedItem.findOne({
            where: {
                pinnedItemId,
                channelId
            }
        });
        
        if (!pinnedItem) {
            return res.status(404).json({ error: 'Pinned item not found' });
        }
        
        // Check if user has permission (user is the one who pinned it or is an admin)
        const isAdmin = await ChannelMember.findOne({
            where: {
                channelId,
                userId: req.user.userId,
                role: {
                    [Op.in]: ['admin', 'owner']
                }
            }
        });
        
        if (pinnedItem.pinnedByUserId !== req.user.userId && !isAdmin) {
            return res.status(403).json({ error: 'You do not have permission to unpin this item' });
        }
        
        // Delete the pinned item
        await pinnedItem.destroy();
        
        // Emit socket event for real-time updates
        socketUtil.emitToChannel(channelId, 'pin_removed', { pinnedItemId, channelId });
        
        res.json({ success: true, message: 'Item unpinned successfully' });
    } catch (error) {
        console.error('Error unpinning item:', error);
        res.status(500).json({ error: 'An error occurred while unpinning the item' });
    }
};

/**
 * Get all pinned items in a channel
 * @route GET /api/channels/:channelId/pins
 */
const getPinnedItems = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        
        // Verify channel exists
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if user has access to this channel
        const isMember = await ChannelMember.findOne({
            where: {
                channelId,
                userId: req.user.userId
            }
        });
        
        if (!isMember && !channel.isPublic) {
            return res.status(403).json({ error: 'You do not have access to this channel' });
        }
        
        // Fetch all pinned items with related data
        const pinnedItems = await PinnedItem.findAll({
            where: { channelId },
            include: [
                {
                    model: User,
                    as: 'pinnedBy',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url']
                },
                {
                    model: Message,
                    as: 'message',
                    include: {
                        model: User,
                        as: 'sender',
                        attributes: ['user_id', 'username', 'display_name', 'avatar_url']
                    }
                },
                {
                    model: File,
                    as: 'file',
                    attributes: ['file_id', 'filename', 'file_url', 'file_size', 'mime_type']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        
        res.json(pinnedItems);
    } catch (error) {
        console.error('Error fetching pinned items:', error);
        res.status(500).json({ error: 'An error occurred while fetching pinned items' });
    }
};

module.exports = {
    getAllWorkspaceChannels,
    getChannelById,
    createChannel,
    updateChannel,
    deleteChannel,
    getChannelMembers,
    addChannelMembers,
    removeChannelMember,
    joinChannel,
    leaveChannel,
    getChannelMessages,
    getUserChannels,
    pinItem,
    unpinItem,
    getPinnedItems
};
