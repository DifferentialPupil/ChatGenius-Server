module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define(
    'File',
    {
      fileId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'file_id',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: {
            tableName: 'users',
            schema: 'core'
          },
          key: 'user_id',
        },
        onDelete: 'CASCADE',
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'filename',
      },
      fileUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'file_url',
      },
      mimeType: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'mime_type',
      },
      fileSize: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'file_size',
      },
      messageId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'message_id',
        references: {
          model: {
            tableName: 'messages',
            schema: 'messaging'
          },
          key: 'message_id',
        },
        onDelete: 'SET NULL',
      },
      directMessageId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'direct_message_id',
        references: {
          model: {
            tableName: 'direct_messages',
            schema: 'messaging'
          },
          key: 'direct_message_id',
        },
        onDelete: 'SET NULL',
      },
    },
    {
      tableName: 'files',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  File.associate = (models) => {
    // File belongs to a User (uploader)
    File.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'uploader',
      onDelete: 'CASCADE',
    });

    // File can belong to a Message
    File.belongsTo(models.Message, {
      foreignKey: 'message_id',
      as: 'message',
      onDelete: 'SET NULL',
    });

    // File can belong to a DirectMessage
    File.belongsTo(models.DirectMessage, {
      foreignKey: 'direct_message_id',
      as: 'directMessage',
      onDelete: 'SET NULL',
    });

    // File can be pinned
    File.hasMany(models.PinnedItem, {
      foreignKey: 'file_id',
      as: 'pins',
    });
  };

  return File;
}; 