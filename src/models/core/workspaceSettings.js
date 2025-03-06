module.exports = (sequelize, DataTypes) => {
  const WorkspaceSettings = sequelize.define(
    'WorkspaceSettings',
    {
      settingId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'setting_id',
      },
      workspaceId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
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
      aiGlobalAutonomyLevel: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'ai_global_autonomy_level',
        validate: {
          isIn: [['manual', 'review', 'auto']]
        }
      },
    },
    {
      tableName: 'workspace_settings',
      schema: 'core',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  WorkspaceSettings.associate = (models) => {
    // WorkspaceSettings belongs to a Workspace
    WorkspaceSettings.belongsTo(models.Workspace, {
      foreignKey: 'workspace_id',
      as: 'workspace',
      onDelete: 'CASCADE',
    });
  };

  return WorkspaceSettings;
}; 