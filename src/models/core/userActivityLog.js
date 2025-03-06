module.exports = (sequelize, DataTypes) => {
  const UserActivityLog = sequelize.define(
    'UserActivityLog',
    {
      logId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'log_id',
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
      workspaceId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'workspace_id',
        references: {
          model: {
            tableName: 'workspaces',
            schema: 'core'
          },
          key: 'workspace_id',
        },
        onDelete: 'CASCADE',
      },
      action: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'action',
      },
      entityType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'entity_type',
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'entity_id',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'metadata',
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent',
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        field: 'timestamp',
      }
    },
    {
      tableName: 'user_activity_logs',
      schema: 'core',
      timestamps: false, // We're using the timestamp field
      underscored: true,
    }
  );

  UserActivityLog.associate = (models) => {
    // UserActivityLog belongs to a User
    UserActivityLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });

    // UserActivityLog belongs to a Workspace
    UserActivityLog.belongsTo(models.Workspace, {
      foreignKey: 'workspace_id',
      as: 'workspace',
      onDelete: 'CASCADE',
    });
  };

  return UserActivityLog;
}; 