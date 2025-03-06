module.exports = (sequelize, DataTypes) => {
  const PinnedItem = sequelize.define(
    'PinnedItem',
    {
      pinnedItemId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'pinned_item_id',
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
      fileId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'file_id',
        references: {
          model: {
            tableName: 'files',
            schema: 'messaging'
          },
          key: 'file_id',
        },
        onDelete: 'CASCADE',
      },
      pinnedByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'pinned_by_user_id',
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
      tableName: 'pinned_items',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false, // No updated_at column in the table
      underscored: true,
      validate: {
        eitherMessageOrFile() {
          if ((this.messageId === null && this.fileId === null) || 
              (this.messageId !== null && this.fileId !== null)) {
            throw new Error('Either messageId or fileId must be provided, but not both');
          }
        }
      }
    }
  );

  PinnedItem.associate = (models) => {
    // PinnedItem belongs to a Channel
    PinnedItem.belongsTo(models.Channel, {
      foreignKey: 'channel_id',
      as: 'channel',
      onDelete: 'CASCADE',
    });

    // PinnedItem can belong to a Message
    PinnedItem.belongsTo(models.Message, {
      foreignKey: 'message_id',
      as: 'message',
      onDelete: 'CASCADE',
    });

    // PinnedItem can belong to a File
    PinnedItem.belongsTo(models.File, {
      foreignKey: 'file_id',
      as: 'file',
      onDelete: 'CASCADE',
    });

    // PinnedItem belongs to a User (who pinned it)
    PinnedItem.belongsTo(models.User, {
      foreignKey: 'pinned_by_user_id',
      as: 'pinnedBy',
      onDelete: 'CASCADE',
    });
  };

  return PinnedItem;
}; 