module.exports = (sequelize, DataTypes) => {
  const NotificationPreference = sequelize.define(
    'NotificationPreference',
    {
      preferenceId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'preference_id',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
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
      notifyOnDirectMessage: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'notify_on_direct_message',
      },
      notifyOnChannelMessage: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'notify_on_channel_message',
      },
      notifyOnMention: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'notify_on_mention',
      },
      soundEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'sound_enabled',
      },
      desktopNotificationsEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'desktop_notifications_enabled',
      }
    },
    {
      tableName: 'notification_preferences',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  NotificationPreference.associate = (models) => {
    // NotificationPreference belongs to a User
    NotificationPreference.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return NotificationPreference;
}; 