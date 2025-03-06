module.exports = (sequelize, DataTypes) => {
  const Mention = sequelize.define(
    'Mention',
    {
      mentionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'mention_id',
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
        onDelete: 'CASCADE',
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
        onDelete: 'CASCADE',
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
      }
    },
    {
      tableName: 'mentions',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      validate: {
        eitherMessageOrDirectMessage() {
          if ((this.messageId === null && this.directMessageId === null) || 
              (this.messageId !== null && this.directMessageId !== null)) {
            throw new Error('Either messageId or directMessageId must be provided, but not both');
          }
        }
      }
    }
  );

  Mention.associate = (models) => {
    // Mention can belong to a Message
    Mention.belongsTo(models.Message, {
      foreignKey: 'message_id',
      as: 'message',
      onDelete: 'CASCADE',
    });

    // Mention can belong to a DirectMessage
    Mention.belongsTo(models.DirectMessage, {
      foreignKey: 'direct_message_id',
      as: 'directMessage',
      onDelete: 'CASCADE',
    });

    // Mention belongs to a User (the mentioned user)
    Mention.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'mentionedUser',
      onDelete: 'CASCADE',
    });
  };

  return Mention;
}; 