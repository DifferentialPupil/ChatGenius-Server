module.exports = (sequelize, DataTypes) => {
  const PaymentTransaction = sequelize.define(
    'PaymentTransaction',
    {
      transactionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'transaction_id',
      },
      subscriptionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'subscription_id',
        references: {
          model: {
            tableName: 'workspace_subscriptions',
            schema: 'billing'
          },
          key: 'subscription_id',
        },
        onDelete: 'CASCADE',
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'amount',
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
        field: 'currency',
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'status',
      },
      paymentMethodType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'payment_method_type',
      },
      paymentProvider: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'payment_provider',
      },
      providerTransactionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'provider_transaction_id',
      },
      transactionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'transaction_date',
      }
    },
    {
      tableName: 'payment_transactions',
      schema: 'billing',
      timestamps: false, // No timestamps in this table
      underscored: true,
    }
  );

  PaymentTransaction.associate = (models) => {
    // PaymentTransaction belongs to a WorkspaceSubscription
    PaymentTransaction.belongsTo(models.WorkspaceSubscription, {
      foreignKey: 'subscription_id',
      as: 'subscription',
      onDelete: 'CASCADE',
    });
  };

  return PaymentTransaction;
}; 