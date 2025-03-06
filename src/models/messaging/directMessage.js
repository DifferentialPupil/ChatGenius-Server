module.exports = (sequelize, DataTypes) => {
  const DirectMessage = sequelize.define(
    'DirectMessage',
    {
      directMessageId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'direct_message_id',
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'conversation_id',
        references: {
          model: {
            tableName: 'conversations',
            schema: 'messaging'
          },
          key: 'conversation_id',
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
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_deleted',
      }
    },
    {
      tableName: 'direct_messages',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  DirectMessage.associate = (models) => {
    // DirectMessage belongs to a Conversation
    DirectMessage.belongsTo(models.Conversation, {
      foreignKey: 'conversation_id',
      as: 'conversation',
      onDelete: 'CASCADE',
    });

    // DirectMessage belongs to a User (sender)
    DirectMessage.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender',
      onDelete: 'CASCADE',
    });

    // DirectMessage can have many Reactions
    DirectMessage.hasMany(models.Reaction, {
      foreignKey: 'direct_message_id',
      as: 'reactions',
    });

    // DirectMessage can have many Mentions
    DirectMessage.hasMany(models.Mention, {
      foreignKey: 'direct_message_id',
      as: 'mentions',
    });

    // DirectMessage can have Files
    DirectMessage.hasMany(models.File, {
      foreignKey: 'direct_message_id',
      as: 'files',
    });

    // DirectMessage can have Notifications
    DirectMessage.hasMany(models.UserNotification, {
      foreignKey: 'direct_message_id',
      as: 'notifications',
    });
  };

  return DirectMessage;
}; 