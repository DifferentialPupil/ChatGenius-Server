const { ChannelMember, Channel, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all channel members
 * @route GET /channelmembers
 */
const getAllChannelMembers = async (req, res) => {
    try {
        const channelMembers = await ChannelMember.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
                },
                {
                    model: Channel,
                    as: 'channel',
                    attributes: ['channel_id', 'name', 'description', 'is_public']
                }
            ]
        });
        
        return res.json(channelMembers);
    } catch (error) {
        console.error('Error fetching all channel members:', error);
        return res.status(500).json({ error: 'An error occurred while fetching channel members' });
    }
};

/**
 * Get channel members by channelId
 * @route GET /channelmembers/channel/:channelId
 */
const getChannelMembersByChannelId = async (req, res) => {
    try {
        const { channelId } = req.params;
        
        // Check if channel exists
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const channelMembers = await ChannelMember.findAll({
            where: { channelId },
            include: {
                model: User,
                as: 'user',
                attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
            }
        });
        
        return res.json(channelMembers);
    } catch (error) {
        console.error('Error fetching channel members by channel ID:', error);
        return res.status(500).json({ error: 'An error occurred while fetching channel members' });
    }
};

/**
 * Get channel members by userId
 * @route GET /channelmembers/user/:userId
 */
const getChannelMembersByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channelMembers = await ChannelMember.findAll({
            where: { userId },
            include: {
                model: Channel,
                as: 'channel',
                attributes: ['channel_id', 'name', 'description', 'is_public']
            }
        });
        
        return res.json(channelMembers);
    } catch (error) {
        console.error('Error fetching channel members by user ID:', error);
        return res.status(500).json({ error: 'An error occurred while fetching channel members' });
    }
};

/**
 * Get channel members for current user
 * @route GET /channelmembers/me
 */
const getMyChannelMemberships = async (req, res) => {
    try {
        const { userId } = req.user;

        const channelMembers = await ChannelMember.findAll({
            where: { userId },
            include: {
                model: Channel,
                as: 'channel',
                attributes: ['channel_id', 'name', 'description', 'is_public']
            }
        });
        
        return res.json(channelMembers);
    } catch (error) {
        console.error('Error fetching user channel memberships:', error);
        return res.status(500).json({ error: 'An error occurred while fetching channel memberships' });
    }
};

/**
 * Get specific channel member
 * @route GET /channelmembers/:channelMemberId
 */
const getChannelMemberById = async (req, res) => {
    try {
        const { channelMemberId } = req.params;
        
        const channelMember = await ChannelMember.findByPk(channelMemberId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
                },
                {
                    model: Channel,
                    as: 'channel',
                    attributes: ['channel_id', 'name', 'description', 'is_public']
                }
            ]
        });
        
        if (!channelMember) {
            return res.status(404).json({ error: 'Channel member not found' });
        }
        
        return res.json(channelMember);
    } catch (error) {
        console.error('Error fetching channel member:', error);
        return res.status(500).json({ error: 'An error occurred while fetching channel member' });
    }
};

/**
 * Get channel member by channel and user IDs
 * @route GET /channelmembers/channel/:channelId/user/:userId
 */
const getChannelMemberByChannelAndUser = async (req, res) => {
    try {
        const { channelId, userId } = req.params;
        
        const channelMember = await ChannelMember.findOne({
            where: { channelId, userId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
                },
                {
                    model: Channel,
                    as: 'channel',
                    attributes: ['channel_id', 'name', 'description', 'is_public']
                }
            ]
        });
        
        if (!channelMember) {
            return res.status(404).json({ error: 'Channel member not found' });
        }
        
        return res.json(channelMember);
    } catch (error) {
        console.error('Error fetching channel member by channel and user IDs:', error);
        return res.status(500).json({ error: 'An error occurred while fetching channel member' });
    }
};

/**
 * Check if current user is a member of a channel
 * @route GET /channelmembers/check/:channelId
 */
const checkChannelMembership = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userId } = req.user;
        
        const channelMember = await ChannelMember.findOne({
            where: { channelId, userId }
        });
        
        return res.json({ isMember: !!channelMember });
    } catch (error) {
        console.error('Error checking channel membership:', error);
        return res.status(500).json({ error: 'An error occurred while checking channel membership' });
    }
};

/**
 * Add a member to a channel
 * @route POST /channelmembers
 */
const addChannelMember = async (req, res) => {
    try {
        const { channelId, userId, role = 'member' } = req.body;
        const requestingUserId = req.user.userId;
        
        // Check if channel exists
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if requestingUser is a channel admin or the channel creator
        const requestingMember = await ChannelMember.findOne({
            where: { 
                channelId, 
                userId: requestingUserId,
                role: { [Op.in]: ['admin', 'creator'] }
            }
        });
        
        if (!requestingMember) {
            return res.status(403).json({ error: 'You do not have permission to add members to this channel' });
        }
        
        // Check if member already exists
        const existingMember = await ChannelMember.findOne({
            where: { channelId, userId }
        });
        
        if (existingMember) {
            return res.status(409).json({ error: 'User is already a member of this channel' });
        }
        
        // Create new channel member
        const newChannelMember = await ChannelMember.create({
            channelId,
            userId,
            role
        });
        
        // Include user data in response
        const channelMemberWithUser = await ChannelMember.findByPk(newChannelMember.channelMemberId, {
            include: {
                model: User,
                as: 'user',
                attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
            }
        });
        
        return res.status(201).json(channelMemberWithUser);
    } catch (error) {
        console.error('Error adding channel member:', error);
        return res.status(500).json({ error: 'An error occurred while adding channel member' });
    }
};

/**
 * Update a channel member's role
 * @route PATCH /channelmembers/:channelMemberId
 */
const updateChannelMember = async (req, res) => {
    try {
        const { channelMemberId } = req.params;
        const { role } = req.body;
        const requestingUserId = req.user.userId;
        
        // Check if channel member exists
        const channelMember = await ChannelMember.findByPk(channelMemberId, {
            include: {
                model: Channel
            }
        });
        
        if (!channelMember) {
            return res.status(404).json({ error: 'Channel member not found' });
        }
        
        // Check if requestingUser is a channel admin or the channel creator
        const requestingMember = await ChannelMember.findOne({
            where: { 
                channelId: channelMember.channelId, 
                userId: requestingUserId,
                role: { [Op.in]: ['admin', 'creator'] }
            }
        });
        
        if (!requestingMember) {
            return res.status(403).json({ error: 'You do not have permission to update channel members' });
        }
        
        // Don't allow changing creator role
        if (channelMember.role === 'creator') {
            return res.status(403).json({ error: 'Cannot change the role of the channel creator' });
        }
        
        // Update the channel member
        await channelMember.update({ role });
        
        // Get the updated channel member with associations
        const updatedChannelMember = await ChannelMember.findByPk(channelMemberId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
                },
                {
                    model: Channel,
                    as: 'channel',
                    attributes: ['channel_id', 'name', 'description', 'is_public']
                }
            ]
        });
        
        return res.json(updatedChannelMember);
    } catch (error) {
        console.error('Error updating channel member:', error);
        return res.status(500).json({ error: 'An error occurred while updating channel member' });
    }
};

/**
 * Remove a member from a channel
 * @route DELETE /channelmembers/:channelMemberId
 */
const removeChannelMember = async (req, res) => {
    try {
        const { channelMemberId } = req.params;
        const requestingUserId = req.user.userId;
        
        // Check if channel member exists
        const channelMember = await ChannelMember.findByPk(channelMemberId, {
            include: {
                model: Channel
            }
        });
        
        if (!channelMember) {
            return res.status(404).json({ error: 'Channel member not found' });
        }
        
        // A user can remove themselves, or an admin/creator can remove others
        const isSelf = channelMember.userId === requestingUserId;
        
        if (!isSelf) {
            // Check if requestingUser is a channel admin or the channel creator
            const requestingMember = await ChannelMember.findOne({
                where: { 
                    channelId: channelMember.channelId, 
                    userId: requestingUserId,
                    role: { [Op.in]: ['admin', 'creator'] }
                }
            });
            
            if (!requestingMember) {
                return res.status(403).json({ error: 'You do not have permission to remove members from this channel' });
            }
            
            // Don't allow removing the creator
            if (channelMember.role === 'creator') {
                return res.status(403).json({ error: 'Cannot remove the channel creator' });
            }
        }
        
        // Store channel and user IDs before deletion for response
        const { channelId, userId } = channelMember;
        
        // Remove the channel member
        await channelMember.destroy();
        
        return res.json({ 
            message: 'Channel member removed successfully',
            channelId,
            userId,
            channelMemberId
        });
    } catch (error) {
        console.error('Error removing channel member:', error);
        return res.status(500).json({ error: 'An error occurred while removing channel member' });
    }
};

/**
 * Bulk add members to a channel
 * @route POST /channelmembers/bulk
 */
const bulkAddChannelMembers = async (req, res) => {
    try {
        const { channelId, userIds, role = 'member' } = req.body;
        const requestingUserId = req.user.userId;
        
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'User IDs must be provided as a non-empty array' });
        }
        
        // Check if channel exists
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if requestingUser is a channel admin or the channel creator
        const requestingMember = await ChannelMember.findOne({
            where: { 
                channelId, 
                userId: requestingUserId,
                role: { [Op.in]: ['admin', 'creator'] }
            }
        });
        
        if (!requestingMember) {
            return res.status(403).json({ error: 'You do not have permission to add members to this channel' });
        }
        
        // Check which users already exist in the channel
        const existingMembers = await ChannelMember.findAll({
            where: { 
                channel_id: channelId, 
                user_id: { [Op.in]: userIds }
            },
            attributes: ['user_id']
        });
        
        const existingUserIds = existingMembers.map(member => member.user_id);
        const newUserIds = userIds.filter(id => !existingUserIds.includes(id));
        
        // Check if all users exist
        const users = await User.findAll({
            where: { user_id: { [Op.in]: newUserIds } },
            attributes: ['user_id']
        });
        
        const validUserIds = users.map(user => user.user_id);
        const invalidUserIds = newUserIds.filter(id => !validUserIds.includes(id));
        
        if (invalidUserIds.length > 0) {
            return res.status(404).json({ 
                error: 'Some users were not found', 
                invalidUserIds 
            });
        }
        
        // Create new channel members
        const channelMembers = validUserIds.map(userId => ({
            channelId,
            userId,
            role
        }));
        
        await ChannelMember.bulkCreate(channelMembers);
        
        // Return the complete list of new members with user data
        const newChannelMembers = await ChannelMember.findAll({
            where: { 
                channelId, 
                userId: { [Op.in]: validUserIds }
            },
            include: {
                model: User,
                as: 'user',
                attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
            }
        });
        
        return res.status(201).json({
            added: newChannelMembers,
            alreadyMembers: existingUserIds
        });
    } catch (error) {
        console.error('Error bulk adding channel members:', error);
        return res.status(500).json({ error: 'An error occurred while adding channel members' });
    }
};

module.exports = {
    getAllChannelMembers,
    getChannelMembersByChannelId,
    getChannelMembersByUserId,
    getMyChannelMemberships,
    getChannelMemberById,
    getChannelMemberByChannelAndUser,
    checkChannelMembership,
    addChannelMember,
    updateChannelMember,
    removeChannelMember,
    bulkAddChannelMembers
};
