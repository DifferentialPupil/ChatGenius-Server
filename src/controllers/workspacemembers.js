const { WorkspaceMember, Workspace, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all workspace members
 * @route GET /workspacemembers
 */
const getAllWorkspaceMembers = async (req, res) => {
    try {
        const workspaceMembers = await WorkspaceMember.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
                },
                {
                    model: Workspace,
                    as: 'workspace',
                    attributes: ['workspace_id', 'name', 'logo_url']
                }
            ]
        });
        
        return res.json(workspaceMembers);
    } catch (error) {
        console.error('Error fetching all workspace members:', error);
        return res.status(500).json({ error: 'An error occurred while fetching workspace members' });
    }
};

/**
 * Get workspace members by workspaceId
 * @route GET /workspacemembers/workspace/:workspaceId
 */
const getWorkspaceMembersByWorkspaceId = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        
        // Check if workspace exists
        const workspace = await Workspace.findByPk(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const workspaceMembers = await WorkspaceMember.findAll({
            where: { workspaceId },
            include: {
                model: User,
                as: 'user',
                attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
            }
        });
        
        return res.json(workspaceMembers);
    } catch (error) {
        console.error('Error fetching workspace members by workspace ID:', error);
        return res.status(500).json({ error: 'An error occurred while fetching workspace members' });
    }
};

/**
 * Get workspace members by userId
 * @route GET /workspacemembers/user/:userId
 */
const getWorkspaceMembersByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const workspaceMembers = await WorkspaceMember.findAll({
            where: { userId },
            include: {
                model: Workspace,
                as: 'workspace',
                attributes: ['workspace_id', 'name', 'logo_url']
            }
        });
        
        return res.json(workspaceMembers);
    } catch (error) {
        console.error('Error fetching workspace members by user ID:', error);
        return res.status(500).json({ error: 'An error occurred while fetching workspace members' });
    }
};

/**
 * Get workspace memberships for current user
 * @route GET /workspacemembers/me
 */
const getMyWorkspaceMemberships = async (req, res) => {
    try {
        const { userId } = req.user;

        const workspaceMembers = await WorkspaceMember.findAll({
            where: { userId },
            include: {
                model: Workspace,
                as: 'workspace',
                attributes: ['workspace_id', 'name', 'logo_url']
            }
        });
        
        return res.json(workspaceMembers);
    } catch (error) {
        console.error('Error fetching user workspace memberships:', error);
        return res.status(500).json({ error: 'An error occurred while fetching workspace memberships' });
    }
};

/**
 * Get specific workspace member
 * @route GET /workspacemembers/:workspaceMemberId
 */
const getWorkspaceMemberById = async (req, res) => {
    try {
        const { workspaceMemberId } = req.params;
        
        const workspaceMember = await WorkspaceMember.findByPk(workspaceMemberId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
                },
                {
                    model: Workspace,
                    as: 'workspace',
                    attributes: ['workspace_id', 'name', 'logo_url']
                }
            ]
        });
        
        if (!workspaceMember) {
            return res.status(404).json({ error: 'Workspace member not found' });
        }
        
        return res.json(workspaceMember);
    } catch (error) {
        console.error('Error fetching workspace member:', error);
        return res.status(500).json({ error: 'An error occurred while fetching workspace member' });
    }
};

/**
 * Get workspace member by workspace and user IDs
 * @route GET /workspacemembers/workspace/:workspaceId/user/:userId
 */
const getWorkspaceMemberByWorkspaceAndUser = async (req, res) => {
    try {
        const { workspaceId, userId } = req.params;
        
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspaceId, userId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
                },
                {
                    model: Workspace,
                    as: 'workspace',
                    attributes: ['workspace_id', 'name', 'logo_url']
                }
            ]
        });
        
        if (!workspaceMember) {
            return res.status(404).json({ error: 'Workspace member not found' });
        }
        
        return res.json(workspaceMember);
    } catch (error) {
        console.error('Error fetching workspace member by workspace and user IDs:', error);
        return res.status(500).json({ error: 'An error occurred while fetching workspace member' });
    }
};

/**
 * Check if current user is a member of a workspace
 * @route GET /workspacemembers/check/:workspaceId
 */
const checkWorkspaceMembership = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { userId } = req.user;
        
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspaceId, userId }
        });
        
        return res.json({ 
            isMember: !!workspaceMember,
            role: workspaceMember ? workspaceMember.role : null
        });
    } catch (error) {
        console.error('Error checking workspace membership:', error);
        return res.status(500).json({ error: 'An error occurred while checking workspace membership' });
    }
};

/**
 * Check if current user is an admin of a workspace
 * @route GET /workspacemembers/checkadmin/:workspaceId
 */
const checkWorkspaceAdmin = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { userId } = req.user;
        
        const workspaceMember = await WorkspaceMember.findOne({
            where: { 
                workspaceId, 
                userId,
                role: 'Admin'
            }
        });
        
        return res.json({ isAdmin: !!workspaceMember });
    } catch (error) {
        console.error('Error checking workspace admin status:', error);
        return res.status(500).json({ error: 'An error occurred while checking workspace admin status' });
    }
};

/**
 * Add a member to a workspace
 * @route POST /workspacemembers
 */
const addWorkspaceMember = async (req, res) => {
    try {
        const { workspaceId, userId, role = 'Member' } = req.body;
        const requestingUserId = req.user.userId;
        
        // Check if workspace exists
        const workspace = await Workspace.findByPk(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        
        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if requestingUser is a workspace admin
        const requestingMember = await WorkspaceMember.findOne({
            where: { 
                workspaceId, 
                userId: requestingUserId,
                role: 'Admin'
            }
        });
        
        if (!requestingMember) {
            return res.status(403).json({ error: 'You do not have permission to add members to this workspace' });
        }
        
        // Check if member already exists
        const existingMember = await WorkspaceMember.findOne({
            where: { workspaceId, userId }
        });
        
        if (existingMember) {
            return res.status(409).json({ error: 'User is already a member of this workspace' });
        }
        
        // Create new workspace member
        const newWorkspaceMember = await WorkspaceMember.create({
            workspaceId,
            userId,
            role
        });
        
        // Include user data in response
        const workspaceMemberWithUser = await WorkspaceMember.findByPk(newWorkspaceMember.workspaceMemberId, {
            include: {
                model: User,
                as: 'user',
                attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
            }
        });
        
        return res.status(201).json(workspaceMemberWithUser);
    } catch (error) {
        console.error('Error adding workspace member:', error);
        return res.status(500).json({ error: 'An error occurred while adding workspace member' });
    }
};

/**
 * Update a workspace member's role
 * @route PATCH /workspacemembers/:workspaceMemberId
 */
const updateWorkspaceMember = async (req, res) => {
    try {
        const { workspaceMemberId } = req.params;
        const { role } = req.body;
        const requestingUserId = req.user.userId;
        
        if (!role || !['Admin', 'Member'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Role must be either "Admin" or "Member"' });
        }
        
        // Check if workspace member exists
        const workspaceMember = await WorkspaceMember.findByPk(workspaceMemberId, {
            include: {
                model: Workspace,
                as: 'workspace'
            }
        });
        
        if (!workspaceMember) {
            return res.status(404).json({ error: 'Workspace member not found' });
        }
        
        // Check if requestingUser is a workspace admin
        const requestingMember = await WorkspaceMember.findOne({
            where: { 
                workspaceId: workspaceMember.workspaceId, 
                userId: requestingUserId,
                role: 'Admin'
            }
        });
        
        if (!requestingMember) {
            return res.status(403).json({ error: 'You do not have permission to update workspace members' });
        }
        
        // Prevent admins from removing their own admin role if they're the last admin
        if (workspaceMember.userId === requestingUserId && workspaceMember.role === 'Admin' && role !== 'Admin') {
            // Count other admins
            const adminCount = await WorkspaceMember.count({
                where: {
                    workspaceId: workspaceMember.workspaceId,
                    role: 'Admin',
                    userId: { [Op.ne]: requestingUserId }
                }
            });
            
            if (adminCount === 0) {
                return res.status(403).json({ error: 'Cannot remove admin role as you are the only admin for this workspace' });
            }
        }
        
        // Update the workspace member
        await workspaceMember.update({ role });
        
        // Get the updated workspace member with associations
        const updatedWorkspaceMember = await WorkspaceMember.findByPk(workspaceMemberId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
                },
                {
                    model: Workspace,
                    as: 'workspace',
                    attributes: ['workspace_id', 'name', 'logo_url']
                }
            ]
        });
        
        return res.json(updatedWorkspaceMember);
    } catch (error) {
        console.error('Error updating workspace member:', error);
        return res.status(500).json({ error: 'An error occurred while updating workspace member' });
    }
};

/**
 * Remove a member from a workspace
 * @route DELETE /workspacemembers/:workspaceMemberId
 */
const removeWorkspaceMember = async (req, res) => {
    try {
        const { workspaceMemberId } = req.params;
        const requestingUserId = req.user.userId;
        
        // Check if workspace member exists
        const workspaceMember = await WorkspaceMember.findByPk(workspaceMemberId, {
            include: {
                model: Workspace,
                as: 'workspace'
            }
        });
        
        if (!workspaceMember) {
            return res.status(404).json({ error: 'Workspace member not found' });
        }
        
        // A user can remove themselves, or an admin can remove others
        const isSelf = workspaceMember.userId === requestingUserId;
        
        if (!isSelf) {
            // Check if requestingUser is a workspace admin
            const requestingMember = await WorkspaceMember.findOne({
                where: { 
                    workspaceId: workspaceMember.workspaceId, 
                    userId: requestingUserId,
                    role: 'Admin'
                }
            });
            
            if (!requestingMember) {
                return res.status(403).json({ error: 'You do not have permission to remove members from this workspace' });
            }
        }
        
        // Prevent removing the last admin
        if (workspaceMember.role === 'Admin') {
            // Count other admins
            const adminCount = await WorkspaceMember.count({
                where: {
                    workspaceId: workspaceMember.workspaceId,
                    role: 'Admin',
                    userId: { [Op.ne]: workspaceMember.userId }
                }
            });
            
            if (adminCount === 0) {
                return res.status(403).json({ error: 'Cannot remove the only admin from the workspace' });
            }
        }
        
        // Store workspace and user IDs before deletion for response
        const { workspaceId, userId } = workspaceMember;
        
        // Remove the workspace member
        await workspaceMember.destroy();
        
        return res.json({ 
            message: 'Workspace member removed successfully',
            workspaceId,
            userId,
            workspaceMemberId
        });
    } catch (error) {
        console.error('Error removing workspace member:', error);
        return res.status(500).json({ error: 'An error occurred while removing workspace member' });
    }
};

/**
 * Bulk add members to a workspace
 * @route POST /workspacemembers/bulk
 */
const bulkAddWorkspaceMembers = async (req, res) => {
    try {
        const { workspaceId, userIds, role = 'Member' } = req.body;
        const requestingUserId = req.user.userId;
        
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'User IDs must be provided as a non-empty array' });
        }
        
        // Check if workspace exists
        const workspace = await Workspace.findByPk(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        
        // Check if requestingUser is a workspace admin
        const requestingMember = await WorkspaceMember.findOne({
            where: { 
                workspaceId, 
                userId: requestingUserId,
                role: 'Admin'
            }
        });
        
        if (!requestingMember) {
            return res.status(403).json({ error: 'You do not have permission to add members to this workspace' });
        }
        
        // Check which users already exist in the workspace
        const existingMembers = await WorkspaceMember.findAll({
            where: { 
                workspaceId, 
                userId: { [Op.in]: userIds }
            },
            attributes: ['userId']
        });
        
        const existingUserIds = existingMembers.map(member => member.userId);
        const newUserIds = userIds.filter(id => !existingUserIds.includes(id));
        
        // Check if all users exist
        const users = await User.findAll({
            where: { userId: { [Op.in]: newUserIds } },
            attributes: ['userId']
        });
        
        const validUserIds = users.map(user => user.userId);
        const invalidUserIds = newUserIds.filter(id => !validUserIds.includes(id));
        
        if (invalidUserIds.length > 0) {
            return res.status(404).json({ 
                error: 'Some users were not found', 
                invalidUserIds 
            });
        }
        
        // Create new workspace members
        const workspaceMembers = validUserIds.map(userId => ({
            workspaceId,
            userId,
            role
        }));
        
        await WorkspaceMember.bulkCreate(workspaceMembers);
        
        // Return the complete list of new members with user data
        const newWorkspaceMembers = await WorkspaceMember.findAll({
            where: { 
                workspaceId, 
                userId: { [Op.in]: validUserIds }
            },
            include: {
                model: User,
                as: 'user',
                attributes: ['user_id', 'username', 'display_name', 'avatar_url', 'status']
            }
        });
        
        return res.status(201).json({
            added: newWorkspaceMembers,
            alreadyMembers: existingUserIds
        });
    } catch (error) {
        console.error('Error bulk adding workspace members:', error);
        return res.status(500).json({ error: 'An error occurred while adding workspace members' });
    }
};

/**
 * Get the current user's profile in the context of a workspace
 * @route GET /workspacemembers/profile/:workspaceId
 */
const getMyWorkspaceProfile = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const user = req.user;
        
        // Check if workspace exists
        const workspace = await Workspace.findByPk(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        
        // Get workspace member details
        const workspaceMember = await WorkspaceMember.findOne({
            where: { 
                workspaceId, 
                userId: user.userId
            }
        });
        
        if (!workspaceMember) {
            return res.status(404).json({ error: 'You are not a member of this workspace' });
        }
        
        // Return combined user and workspace member data
        return res.json({
            ...user,
            workspaceMemberId: workspaceMember.workspaceMemberId,
            workspaceId: workspaceMember.workspaceId,
            role: workspaceMember.role,
            joinedWorkspaceAt: workspaceMember.createdAt
        });
    } catch (error) {
        console.error('Error fetching workspace profile:', error);
        return res.status(500).json({ error: 'An error occurred while fetching workspace profile' });
    }
};

module.exports = {
    getAllWorkspaceMembers,
    getWorkspaceMembersByWorkspaceId,
    getWorkspaceMembersByUserId,
    getMyWorkspaceMemberships,
    getWorkspaceMemberById,
    getWorkspaceMemberByWorkspaceAndUser,
    checkWorkspaceMembership,
    checkWorkspaceAdmin,
    addWorkspaceMember,
    updateWorkspaceMember,
    removeWorkspaceMember,
    bulkAddWorkspaceMembers,
    getMyWorkspaceProfile
};
