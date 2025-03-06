module.exports = (sequelize, DataTypes) => {
  const Avatar = sequelize.define(
    'Avatar',
    {
      avatarId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'avatar_id',
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
      readyPlayerMeUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'ready_player_me_url',
      },
      voiceId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'voice_id',
      },
      videoStyleId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'video_style_id',
      },
      autonomyLevel: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'autonomy_level',
        validate: {
          isIn: [['manual', 'review', 'auto']]
        }
      },
      dataRetentionPolicy: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'data_retention_policy',
      },
      appearanceCustomization: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'appearance_customization',
      },
      usesGestures: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'uses_gestures',
      },
      voiceEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'voice_enabled',
      },
      videoEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'video_enabled',
      }
    },
    {
      tableName: 'avatars',
      schema: 'ai',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  Avatar.associate = (models) => {
    // Avatar belongs to a User
    Avatar.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });

    // Avatar can have many communication history records
    Avatar.hasMany(models.CommunicationHistory, {
      foreignKey: 'avatar_id',
      as: 'communicationHistory',
    });
  };

  return Avatar;
}; 