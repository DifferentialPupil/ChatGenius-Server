const { 
    Workspace, 
    WorkspaceMember, 
    User, 
    Channel, 
    WorkspaceSettings,
    WorkspaceSubscription,
    sequelize
} = require('../models')
const SocketService = require('../socket/SocketService')
const WebSocketMessageType = require('../models/WebSocketMessageType')

/**
 * Create a new workspace
 * 
 * @route POST /api/workspaces
 * @access Public (with authentication)
 */
exports.createWorkspace = async (req, res) => {
    try {
        const { name, logoUrl } = req.body
        
        if (!name) {
            return res.status(400).json({ error: 'Workspace name is required' })
        }

        const workspace = await sequelize.transaction(async (t) => {
            // Create the workspace
            const newWorkspace = await Workspace.create(
                { name, logoUrl }, 
                { transaction: t }
            )

            // Create default workspace settings
            await WorkspaceSettings.create(
                {
                    workspaceId: newWorkspace.workspaceId,
                    aiGlobalAutonomyLevel: 'review' // Default setting
                },
                { transaction: t }
            )

            // Add the current user as an admin of the workspace
            // Note: This assumes req.user contains the authenticated user info
            if (req.user && req.user.userId) {
                await WorkspaceMember.create(
                    {
                        workspaceId: newWorkspace.workspaceId,
                        userId: req.user.userId,
                        role: 'Admin'
                    },
                    { transaction: t }
                )
            }

            return newWorkspace
        })

        // Broadcast the new workspace to all connected clients
        SocketService.broadcast(WebSocketMessageType.WORKSPACE_CREATED, workspace)
        
        res.status(201).json(workspace)
    } catch (error) {
        console.error('Error creating workspace:', error)
        res.status(500).json({ error: 'An error occurred while creating the workspace' })
    }
}

/**
 * Get all workspaces (accessible to the authenticated user)
 * 
 * @route GET /api/workspaces
 * @access Private
 */
exports.getAllWorkspaces = async (req, res) => {
    try {
        // Extract pagination parameters from the request query
        const page = parseInt(req.query.page, 10) || 1 // Default to page 1
        const limit = parseInt(req.query.limit, 10) || 10 // Default limit to 10
        const offset = (page - 1) * limit

        // If the request has a user, filter by workspaces they belong to
        // Otherwise, return all workspaces (likely for admin purposes)
        let workspaces
        let count = 0
        
        if (req.user && req.user.userId) {
            // Get workspaces where the user is a member with pagination
            const { count: totalCount, rows: workspaceMembers } = await WorkspaceMember.findAndCountAll({
                where: { userId: req.user.userId },
                include: [{ model: Workspace, as: 'workspace' }],
                limit,
                offset,
                distinct: true
            })
            
            workspaces = workspaceMembers.map(member => member.workspace)
            count = totalCount
        } else {
            // For admin use or if not filtering by user
            const result = await Workspace.findAndCountAll({
                limit,
                offset
            })
            
            workspaces = result.rows
            count = result.count
        }
        
        // Return paginated results with metadata
        res.status(200).json({
            workspaces,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
                hasMore: page < Math.ceil(count / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching workspaces:', error)
        res.status(500).json({ error: 'An error occurred while fetching workspaces' })
    }
}

/**
 * Get all workspaces (accessible to the authenticated user)
 * 
 * @route GET /api/workspaces
 * @access Private
 */
exports.getAllUserWorkspaces = async (req, res) => {
    try {
        // If the request has a user, filter by workspaces they belong to
        // Otherwise, return all workspaces (likely for admin purposes)
        let workspaces
        
        if (req.user && req.user.userId) {
            // Get workspaces where the user is a member
            const workspaceMembers = await WorkspaceMember.findAll({
                where: { userId: req.user.userId },
                include: [{ model: Workspace, as: 'workspace' }]
            })
            
            workspaces = workspaceMembers.map(member => member.workspace)
        } else {
            // For admin use or if not filtering by user
            workspaces = await Workspace.findAll()
        }
        
        res.status(200).json(workspaces)
    } catch (error) {
        console.error('Error fetching workspaces:', error)
        res.status(500).json({ error: 'An error occurred while fetching workspaces' })
    }
}

/**
 * Get a specific workspace by ID
 * 
 * @route GET /api/workspaces/:workspaceId
 * @access Private
 */
exports.getWorkspaceById = async (req, res) => {
    try {
        const { workspaceId } = req.params
        
        const workspace = await Workspace.findByPk(workspaceId)
        
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' })
        }
        
        // Check if user has access to this workspace
        if (req.user && req.user.userId) {
            const isMember = await WorkspaceMember.findOne({
                where: { 
                    workspaceId: workspaceId,
                    userId: req.user.userId
                }
            })
            
            if (!isMember) {
                return res.status(403).json({ error: 'You do not have access to this workspace' })
            }
        }
        
        res.status(200).json(workspace)
    } catch (error) {
        console.error('Error fetching workspace:', error)
        res.status(500).json({ error: 'An error occurred while fetching the workspace' })
    }
}

/**
 * Update a workspace
 * 
 * @route PATCH /api/workspaces/:workspaceId
 * @access Private (Admin only)
 */
exports.updateWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params
        const { name, logoUrl } = req.body
        
        // Verify the workspace exists
        const workspace = await Workspace.findByPk(workspaceId)
        
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' })
        }
        
        // Check if user is an admin of this workspace
        if (req.user && req.user.userId) {
            const isMember = await WorkspaceMember.findOne({
                where: { 
                    workspaceId,
                    userId: req.user.userId,
                    role: 'Admin'
                }
            })
            
            if (!isMember) {
                return res.status(403).json({ error: 'Only workspace admins can update workspace details' })
            }
        }
        
        // Update the workspace
        const updateData = {}
        if (name) updateData.name = name
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl
        
        await workspace.update(updateData)
        
        // Broadcast the updated workspace
        SocketService.broadcast(WebSocketMessageType.WORKSPACE_UPDATED, workspace)
        
        res.status(200).json(workspace)
    } catch (error) {
        console.error('Error updating workspace:', error)
        res.status(500).json({ error: 'An error occurred while updating the workspace' })
    }
}

/**
 * Get all users in a workspace
 * 
 * @route GET /api/workspaces/:workspaceId/users
 * @access Private (Admin only)
 */
exports.getWorkspaceUsers = async (req, res) => {
    try {
        const { workspaceId } = req.params
        
        // Verify workspace exists
        const workspace = await Workspace.findByPk(workspaceId)
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' })
        }
        
        // Check if user is an admin of this workspace
        if (req.user && req.user.userId) {
            const isMember = await WorkspaceMember.findOne({
                where: { 
                    workspaceId: workspaceId,
                    userId: req.user.userId,
                    role: 'Admin'
                }
            })
            
            if (!isMember) {
                return res.status(403).json({ error: 'Only workspace admins can view all workspace users' })
            }
        }
        
        // Get all members with their user details
        const members = await WorkspaceMember.findAll({
            where: { workspaceId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'username', 'displayName', 'email', 'avatarUrl', 'status']
                }
            ]
        })
        
        const users = members.map(member => ({
            ...member.user.toJSON(),
            role: member.role
        }))
        
        res.status(200).json(users)
    } catch (error) {
        console.error('Error fetching workspace users:', error)
        res.status(500).json({ error: 'An error occurred while fetching workspace users' })
    }
}

/**
 * Invite users to a workspace
 * 
 * @route POST /api/workspaces/:workspaceId/users/invite
 * @access Private (Admin only)
 */
exports.inviteUsers = async (req, res) => {
    try {
        const { workspaceId } = req.params
        const { emails } = req.body
        
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: 'At least one email address is required' })
        }
        
        // Verify workspace exists
        const workspace = await Workspace.findByPk(workspaceId)
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' })
        }
        
        // Check if user is an admin of this workspace
        if (req.user && req.user.userId) {
            const isMember = await WorkspaceMember.findOne({
                where: { 
                    workspaceId: workspaceId,
                    userId: req.user.userId,
                    role: 'Admin'
                }
            })
            
            if (!isMember) {
                return res.status(403).json({ error: 'Only workspace admins can invite users' })
            }
        }
        
        // In a real implementation, this would send invitation emails
        // For now, we'll just find users with matching emails and add them to the workspace
        
        const existingUsers = await User.findAll({
            where: { email: emails }
        })
        
        const results = {
            invited: [],
            alreadyMembers: [],
            notFound: emails
        }
        
        // Process found users
        if (existingUsers.length > 0) {
            for (const user of existingUsers) {
                // Check if already a member
                const existingMember = await WorkspaceMember.findOne({
                    where: {
                        workspaceId,
                        userId: user.userId
                    }
                })
                
                if (existingMember) {
                    results.alreadyMembers.push(user.email)
                } else {
                    // Add to workspace as a member
                    await WorkspaceMember.create({
                        workspaceId,
                        userId: user.userId,
                        role: 'Member'
                    })
                    
                    results.invited.push(user.email)
                }
                
                // Remove from notFound list
                const index = results.notFound.indexOf(user.email)
                if (index > -1) {
                    results.notFound.splice(index, 1)
                }
            }
        }
        
        res.status(200).json(results)
    } catch (error) {
        console.error('Error inviting users to workspace:', error)
        res.status(500).json({ error: 'An error occurred while inviting users' })
    }
}

/**
 * Remove a user from a workspace
 * 
 * @route DELETE /api/workspaces/:workspaceId/users/:userId
 * @access Private (Admin only)
 */
exports.removeUser = async (req, res) => {
    try {
        const { workspaceId, userId } = req.params
        
        // Verify workspace exists
        const workspace = await Workspace.findByPk(workspaceId)
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' })
        }
        
        // Check if user is an admin of this workspace
        if (req.user && req.user.userId) {
            const adminMember = await WorkspaceMember.findOne({
                where: { 
                    workspaceId,
                    userId: req.user.userId,
                    role: 'Admin'
                }
            })
            
            if (!adminMember) {
                return res.status(403).json({ error: 'Only workspace admins can remove users' })
            }
            
            // Prevent admins from removing themselves
            if (req.user.userId === userId) {
                return res.status(400).json({ error: 'You cannot remove yourself from the workspace' })
            }
        }
        
        // Find the member to remove
        const memberToRemove = await WorkspaceMember.findOne({
            where: {
                workspaceId,
                userId
            },
            include: [
                {
                    model: User,
                    as: 'user'
                }
            ]
        })
        
        if (!memberToRemove) {
            return res.status(404).json({ error: 'User is not a member of this workspace' })
        }
        
        // Remove the user from all channels in this workspace
        // Implementation would depend on your channel access control
        
        // Remove the user from the workspace
        await memberToRemove.destroy()
        
        // Broadcast the user removal
        SocketService.broadcast(WebSocketMessageType.WORKSPACE_MEMBER_REMOVED, {
            workspaceId,
            userId
        })
        
        res.status(200).json({ 
            message: `${memberToRemove.user.displayName || memberToRemove.user.username} has been removed from the workspace`
        })
    } catch (error) {
        console.error('Error removing user from workspace:', error)
        res.status(500).json({ error: 'An error occurred while removing the user' })
    }
}

/**
 * Get workspace settings
 * 
 * @route GET /api/workspaces/:workspaceId/settings
 * @access Private (Admin only)
 */
exports.getWorkspaceSettings = async (req, res) => {
    try {
        const { workspaceId } = req.params
        
        // Verify workspace exists
        const workspace = await Workspace.findByPk(workspaceId)
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' })
        }
        
        // Check if user is an admin of this workspace
        if (req.user && req.user.userId) {
            const isMember = await WorkspaceMember.findOne({
                where: { 
                    workspaceId,
                    userId: req.user.userId,
                    role: 'Admin'
                }
            })
            
            if (!isMember) {
                return res.status(403).json({ error: 'Only workspace admins can view workspace settings' })
            }
        }
        
        // Get workspace settings
        const settings = await WorkspaceSettings.findOne({
            where: { workspaceId }
        })
        
        if (!settings) {
            return res.status(404).json({ error: 'Workspace settings not found' })
        }
        
        res.status(200).json(settings)
    } catch (error) {
        console.error('Error fetching workspace settings:', error)
        res.status(500).json({ error: 'An error occurred while fetching workspace settings' })
    }
}

/**
 * Update workspace settings
 * 
 * @route PATCH /api/workspaces/:workspaceId/settings
 * @access Private (Admin only)
 */
exports.updateWorkspaceSettings = async (req, res) => {
    try {
        const { workspaceId } = req.params
        const { aiGlobalAutonomyLevel } = req.body
        
        // Validate autonomy level
        if (aiGlobalAutonomyLevel && !['manual', 'review', 'auto'].includes(aiGlobalAutonomyLevel)) {
            return res.status(400).json({ error: 'Invalid AI autonomy level' })
        }
        
        // Verify workspace exists
        const workspace = await Workspace.findByPk(workspaceId)
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' })
        }
        
        // Check if user is an admin of this workspace
        if (req.user && req.user.userId) {
            const isMember = await WorkspaceMember.findOne({
                where: { 
                    workspaceId,
                    userId: req.user.userId,
                    role: 'Admin'
                }
            })
            
            if (!isMember) {
                return res.status(403).json({ error: 'Only workspace admins can update workspace settings' })
            }
        }
        
        // Get workspace settings
        let settings = await WorkspaceSettings.findOne({
            where: { workspaceId }
        })
        
        if (!settings) {
            // Create settings if they don't exist
            settings = await WorkspaceSettings.create({
                workspaceId,
                aiGlobalAutonomyLevel: aiGlobalAutonomyLevel || 'review'
            })
        } else {
            // Update existing settings
            await settings.update({
                aiGlobalAutonomyLevel: aiGlobalAutonomyLevel || settings.aiGlobalAutonomyLevel
            })
        }
        
        res.status(200).json(settings)
    } catch (error) {
        console.error('Error updating workspace settings:', error)
        res.status(500).json({ error: 'An error occurred while updating workspace settings' })
    }
}

/**
 * Get all data related to a workspace (workspace details, members, channels)
 * 
 * @route GET /api/workspaces/:workspaceId/data
 * @access Private
 */
exports.getAllWorkspaceData = async (req, res) => {
    try {
        const { workspaceId } = req.params
        
        // Verify workspace exists and user has access
        const workspace = await Workspace.findByPk(workspaceId)
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' })
        }
        
        // Check if user has access to this workspace
        if (req.user && req.user.userId) {
            const isMember = await WorkspaceMember.findOne({
                where: { 
                    workspaceId,
                    userId: req.user.userId
                }
            })
            
            if (!isMember) {
                return res.status(403).json({ error: 'You do not have access to this workspace' })
            }
        }
        
        // Get workspace members
        const workspaceMembers = await WorkspaceMember.findAll({
            where: { workspaceId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'username', 'displayName', 'email', 'avatarUrl', 'status']
                }
            ]
        })
        
        // Get channels
        const channels = await Channel.findAll({
            where: { workspaceId }
        })
        
        // Get workspace settings (if admin)
        let settings = null
        if (req.user && req.user.userId) {
            const isAdmin = await WorkspaceMember.findOne({
                where: { 
                    workspaceId,
                    userId: req.user.userId,
                    role: 'Admin'
                }
            })
            
            if (isAdmin) {
                settings = await WorkspaceSettings.findOne({
                    where: { workspaceId }
                })
            }
        }
        
        res.status(200).json({
            workspace,
            workspaceMembers: workspaceMembers.map(member => ({
                userId: member.user.userId,
                username: member.user.username,
                displayName: member.user.displayName,
                email: member.user.email,
                avatarUrl: member.user.avatarUrl,
                status: member.user.status,
                role: member.role
            })),
            channels,
            settings
        })
    } catch (error) {
        console.error('Error fetching workspace data:', error)
        res.status(500).json({ error: 'An error occurred while fetching workspace data' })
    }
}

// Helper functions
async function workspaceExists(workspaceId) {
    return await Workspace.findOne({ where: { workspaceId } })
}