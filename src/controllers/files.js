const { File, User, Message, DirectMessage, sequelize } = require('../models');
const { deleteFileFromS3 } = require('../utils/fileUtils');
const { Op } = require('sequelize');

/**
 * Upload a file to S3 and save metadata to the database
 * @route POST /api/files/upload
 */
const uploadFile = async (req, res, next) => {
  try {
    // File data comes from multer-s3 middleware
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create file record in database
    const fileData = {
      userId: req.user.userId,
      filename: req.file.originalname,
      fileUrl: req.file.location, // S3 URL
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      // messageId and directMessageId will be null initially
      // They will be set when the file is attached to a message
    };

    const file = await File.create(fileData);

    // Return the file metadata
    return res.status(201).json({
      file: {
        fileId: file.fileId,
        filename: file.filename,
        fileUrl: file.fileUrl,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        createdAt: file.createdAt,
      },
      uploader: req.user
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    next(error);
  }
};

/**
 * Get file by ID
 * @route GET /api/files/:fileId
 */
const getFileById = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      where: { fileId },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['userId', 'username', 'displayName', 'avatarUrl']
        }
      ]
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to the file
    if (file.messageId) {
      // For files attached to channel messages, check if user is a member of the channel
      const message = await Message.findByPk(file.messageId, {
        include: [{ association: 'channel' }]
      });
      
      if (message) {
        const isChannelMember = await sequelize.query(
          `SELECT 1 FROM messaging.channel_members 
           WHERE channel_id = :channelId AND user_id = :userId`,
          {
            replacements: { 
              channelId: message.channel.channelId, 
              userId: req.user.userId 
            },
            type: sequelize.QueryTypes.SELECT
          }
        );
        
        if (!isChannelMember.length && file.userId !== req.user.userId) {
          return res.status(403).json({ message: 'You do not have access to this file' });
        }
      }
    } else if (file.directMessageId) {
      // For files attached to direct messages, check if user is a participant
      const directMessage = await DirectMessage.findByPk(file.directMessageId, {
        include: [{ association: 'conversation' }]
      });
      
      if (directMessage) {
        const isParticipant = await sequelize.query(
          `SELECT 1 FROM messaging.conversation_participants 
           WHERE conversation_id = :conversationId AND user_id = :userId`,
          {
            replacements: { 
              conversationId: directMessage.conversation.conversationId, 
              userId: req.user.userId 
            },
            type: sequelize.QueryTypes.SELECT
          }
        );
        
        if (!isParticipant.length) {
          return res.status(403).json({ message: 'You do not have access to this file' });
        }
      }
    } else if (file.userId !== req.user.userId) {
      // If file is not attached to any message, only the uploader can access it
      return res.status(403).json({ message: 'You do not have access to this file' });
    }

    return res.json(file);
  } catch (error) {
    console.error('Error retrieving file:', error);
    next(error);
  }
};

/**
 * Get all files uploaded by the current user
 * @route GET /api/files/my-uploads
 */
const getUserFiles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log('req.user.userId', req.user.userId);

    const { count, rows: files } = await File.findAndCountAll({
      where: { userId: req.user.userId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return res.json({
      files,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit,
      }
    });
  } catch (error) {
    console.error('Error retrieving user files:', error);
    next(error);
  }
};

/**
 * Update file information (filename only)
 * @route PATCH /api/files/:fileId
 */
const updateFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { filename } = req.body;

    const file = await File.findOne({
      where: { fileId }
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user is the owner of the file
    if (file.userId !== req.user.userId) {
      return res.status(403).json({ message: 'You do not have permission to update this file' });
    }

    // Update filename
    if (filename) {
      file.filename = filename;
      await file.save();
    }

    return res.json(file);
  } catch (error) {
    console.error('Error updating file:', error);
    next(error);
  }
};

/**
 * Delete a file
 * @route DELETE /api/files/:fileId
 */
const deleteFile = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      where: { fileId }
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user is the owner of the file
    if (file.userId !== req.user.userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this file' });
    }

    // Delete the file from S3
    await deleteFileFromS3(file.fileUrl);

    // Delete the file from the database
    await file.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting file:', error);
    next(error);
  }
};

/**
 * Search for files by filename
 * @route GET /api/files/search
 */
const searchFiles = async (req, res, next) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search files by name, only user's own files and files in channels they are a member of
    const { count, rows: files } = await File.findAndCountAll({
      where: {
        [Op.or]: [
          // User's own files
          { userId: req.user.userId },
          // Files in messages from channels user is a member of
          { 
            messageId: {
              [Op.not]: null
            } 
          },
          // Files in direct messages user is a participant of
          { 
            directMessageId: {
              [Op.not]: null
            } 
          }
        ],
        filename: {
          [Op.iLike]: `%${query}%`
        }
      },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['userId', 'username', 'displayName', 'avatarUrl']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Further filter the results to ensure proper access permissions
    const accessibleFiles = await Promise.all(
      files.map(async (file) => {
        let hasAccess = false;
        
        // User has access to their own files
        if (file.userId === req.user.userId) {
          hasAccess = true;
        } 
        // Check channel membership for message files
        else if (file.messageId) {
          const message = await Message.findByPk(file.messageId, {
            include: [{ association: 'channel' }]
          });
          
          if (message) {
            const isChannelMember = await sequelize.query(
              `SELECT 1 FROM messaging.channel_members 
              WHERE channel_id = :channelId AND user_id = :userId`,
              {
                replacements: { 
                  channelId: message.channel.channelId, 
                  userId: req.user.userId 
                },
                type: sequelize.QueryTypes.SELECT
              }
            );
            
            hasAccess = isChannelMember.length > 0;
          }
        } 
        // Check conversation participation for direct message files
        else if (file.directMessageId) {
          const directMessage = await DirectMessage.findByPk(file.directMessageId, {
            include: [{ association: 'conversation' }]
          });
          
          if (directMessage) {
            const isParticipant = await sequelize.query(
              `SELECT 1 FROM messaging.conversation_participants 
              WHERE conversation_id = :conversationId AND user_id = :userId`,
              {
                replacements: { 
                  conversationId: directMessage.conversation.conversationId, 
                  userId: req.user.userId 
                },
                type: sequelize.QueryTypes.SELECT
              }
            );
            
            hasAccess = isParticipant.length > 0;
          }
        }
        
        return hasAccess ? file : null;
      })
    );

    // Filter out null values (files user doesn't have access to)
    const filteredFiles = accessibleFiles.filter(file => file !== null);

    return res.json({
      files: filteredFiles,
      pagination: {
        totalItems: filteredFiles.length,
        totalPages: Math.ceil(filteredFiles.length / limit),
        currentPage: page,
        itemsPerPage: limit,
      }
    });
  } catch (error) {
    console.error('Error searching files:', error);
    next(error);
  }
};

/**
 * Get files for a specific channel
 * @route GET /api/channels/:channelId/files
 */
const getChannelFiles = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Check if user is a member of the channel
    const isMember = await sequelize.query(
      `SELECT 1 FROM messaging.channel_members 
       WHERE channel_id = :channelId AND user_id = :userId`,
      {
        replacements: { channelId, userId: req.user.userId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!isMember.length) {
      return res.status(403).json({ message: 'You are not a member of this channel' });
    }

    // Get message IDs for the channel
    const messageIds = await Message.findAll({
      where: { channelId },
      attributes: ['messageId']
    }).then(messages => messages.map(m => m.messageId));

    // Get files attached to those messages
    const { count, rows: files } = await File.findAndCountAll({
      where: {
        messageId: {
          [Op.in]: messageIds
        }
      },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['userId', 'username', 'displayName', 'avatarUrl']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return res.json({
      files,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit,
      }
    });
  } catch (error) {
    console.error('Error retrieving channel files:', error);
    next(error);
  }
};

module.exports = {
  uploadFile,
  getFileById,
  getUserFiles,
  updateFile,
  deleteFile,
  searchFiles,
  getChannelFiles
}; 