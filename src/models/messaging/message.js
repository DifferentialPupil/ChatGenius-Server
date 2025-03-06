module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
    {
      messageId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'message_id',
      },
      channelId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'channel_id',
        references: {
          model: {
            tableName: 'channels',
            schema: 'messaging'
          },
          key: 'channel_id',
        },
        onDelete: 'CASCADE',
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'sender_id',
        references: {
          model: {
            tableName: 'users',
            schema: 'core'
          },
          key: 'user_id',
        },
        onDelete: 'CASCADE',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'content',
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_edited',
      },
      parentMessageId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'parent_message_id',
        references: {
          model: {
            tableName: 'messages',
            schema: 'messaging'
          },
          key: 'message_id',
        },
        onDelete: 'CASCADE',
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_deleted',
      }
    },
    {
      tableName: 'messages',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  Message.associate = (models) => {
    // Message belongs to a Channel
    Message.belongsTo(models.Channel, {
      foreignKey: 'channel_id',
      as: 'channel',
      onDelete: 'CASCADE',
    });

    // Message belongs to a User (sender)
    Message.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender',
      onDelete: 'CASCADE',
    });

    // Message can have a parent Message (for threads)
    Message.belongsTo(models.Message, {
      foreignKey: 'parent_message_id',
      as: 'parentMessage',
      onDelete: 'CASCADE',
    });

    // Message can have many child Messages (replies)
    Message.hasMany(models.Message, {
      foreignKey: 'parent_message_id',
      as: 'replies',
    });

    // Message can have many Reactions
    Message.hasMany(models.Reaction, {
      foreignKey: 'message_id',
      as: 'reactions',
    });

    // Message can have many Mentions
    Message.hasMany(models.Mention, {
      foreignKey: 'message_id',
      as: 'mentions',
    });

    // Message can be pinned
    Message.hasMany(models.PinnedItem, {
      foreignKey: 'message_id',
      as: 'pins',
    });

    // Message can have Files
    Message.hasMany(models.File, {
      foreignKey: 'message_id',
      as: 'files',
    });

    // Message can have Notifications
    Message.hasMany(models.UserNotification, {
      foreignKey: 'message_id',
      as: 'notifications',
    });
  };

  return Message;
}; 