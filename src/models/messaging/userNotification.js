module.exports = (sequelize, DataTypes) => {
  const UserNotification = sequelize.define(
    'UserNotification',
    {
      notificationId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'notification_id',
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
      channelId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'channel_id',
        references: {
          model: {
            tableName: 'channels',
            schema: 'messaging'
          },
          key: 'channel_id',
        },
        onDelete: 'SET NULL',
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'type',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'content',
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_read',
      }
    },
    {
      tableName: 'user_notifications',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false, // No updated_at column in the table
      underscored: true,
      validate: {
        hasAtLeastOneReference() {
          if (this.messageId === null && this.directMessageId === null && this.channelId === null) {
            throw new Error('At least one of messageId, directMessageId, or channelId must be provided');
          }
        }
      }
    }
  );

  UserNotification.associate = (models) => {
    // UserNotification belongs to a User
    UserNotification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });

    // UserNotification can be related to a Message
    UserNotification.belongsTo(models.Message, {
      foreignKey: 'message_id',
      as: 'message',
      onDelete: 'SET NULL',
    });

    // UserNotification can be related to a DirectMessage
    UserNotification.belongsTo(models.DirectMessage, {
      foreignKey: 'direct_message_id',
      as: 'directMessage',
      onDelete: 'SET NULL',
    });

    // UserNotification can be related to a Channel
    UserNotification.belongsTo(models.Channel, {
      foreignKey: 'channel_id',
      as: 'channel',
      onDelete: 'SET NULL',
    });
  };

  return UserNotification;
}; 