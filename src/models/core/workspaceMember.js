module.exports = (sequelize, DataTypes) => {
  const WorkspaceMember = sequelize.define(
    'WorkspaceMember',
    {
      workspaceMemberId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'workspace_member_id',
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
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'role',
        validate: {
          isIn: [['Admin', 'Member']],
        },
      }
    },
    {
      tableName: 'workspace_members',
      schema: 'core',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['workspace_id', 'user_id'],
        },
      ],
    }
  );

  WorkspaceMember.associate = (models) => {
    // A WorkspaceMember belongs to a single Workspace
    WorkspaceMember.belongsTo(models.Workspace, {
      foreignKey: 'workspace_id',
      as: 'workspace',
      onDelete: 'CASCADE',
    });

    // A WorkspaceMember belongs to a single User
    WorkspaceMember.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return WorkspaceMember;
}; 