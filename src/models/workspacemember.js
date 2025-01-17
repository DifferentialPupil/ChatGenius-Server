module.exports = (sequelize, DataTypes) => {
    const WorkspaceMember = sequelize.define(
      'WorkspaceMember',
      {
        workspacememberid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          field: 'workspacememberid',
        },
        workspaceid: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'workspaceid',
          references: {
            model: 'workspaces', // Should match the table name in your DB
            key: 'workspaceid',
          },
          onDelete: 'CASCADE',
        },
        userid: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'userid',
          references: {
            model: 'users', // Should match the table name in your DB
            key: 'userid',
          },
          onDelete: 'CASCADE',
        },
        role: {
          type: DataTypes.STRING(10),
          allowNull: false,
          validate: {
            isIn: [['Admin', 'Member']],
          },
          field: 'role',
        }
      },
      {
        tableName: 'workspacemembers',
        timestamps: true,
        createdAt: 'createdat',
        updatedAt: 'updatedat',
        indexes: [
          {
            unique: true,
            fields: ['workspaceid', 'userid'],
          },
        ],
      }
    );
  
    WorkspaceMember.associate = (models) => {
      // A WorkspaceMember belongs to a single Workspace
      WorkspaceMember.belongsTo(models.Workspace, {
        foreignKey: 'workspaceid',
        as: 'workspace',
        onDelete: 'CASCADE',
      });
  
      // A WorkspaceMember belongs to a single User
      WorkspaceMember.belongsTo(models.User, {
        foreignKey: 'userid',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return WorkspaceMember;
  };