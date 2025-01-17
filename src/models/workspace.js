module.exports = (sequelize, DataTypes) => {
  const Workspace = sequelize.define(
    'workspace',
    {
      workspaceid: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      logourl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: 'workspaces',
      timestamps: true,
      createdAt: 'createdat',
      updatedAt: 'updatedat',
      // If your timestamps in the DB use the default column names createdAt/updatedAt,
      // you don't need to specify them here. They will be automatically mapped.
    }
  );

  // Define any associations here
  Workspace.associate = (models) => {
    // For example:
    // Workspace.hasMany(models.User, {
    //   foreignKey: 'workspaceId',
    //   onDelete: 'CASCADE',
    // });
  };

  return Workspace;
};