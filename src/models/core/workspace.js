module.exports = (sequelize, DataTypes) => {
  const Workspace = sequelize.define(
    'Workspace',
    {
      workspaceId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'workspace_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'name',
      },
      logoUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'logo_url',
      },
    },
    {
      tableName: 'workspaces',
      schema: 'core',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  Workspace.associate = (models) => {
    // A workspace can have many users through workspace_members
    Workspace.belongsToMany(models.User, {
      through: models.WorkspaceMember,
      foreignKey: 'workspace_id',
      otherKey: 'user_id',
    });
    
    // A workspace can have many channels
    Workspace.hasMany(models.Channel, {
      foreignKey: 'workspace_id',
      as: 'channels',
    });
    
    // A workspace can have one settings record
    Workspace.hasOne(models.WorkspaceSettings, {
      foreignKey: 'workspace_id',
      as: 'settings',
    });
    
    // A workspace can have one subscription
    Workspace.hasOne(models.WorkspaceSubscription, {
      foreignKey: 'workspace_id',
      as: 'subscription',
    });
  };

  return Workspace;
}; 