const { sequelize, Order } = require('../models');

async function migrate() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableDesc = await queryInterface.describeTable('orders');
    console.log('Current columns in orders:', Object.keys(tableDesc));

    if (!tableDesc.cancellation_reason) {
      await queryInterface.addColumn('orders', 'cancellation_reason', {
        type: sequelize.Sequelize.TEXT,
        allowNull: true,
      });
      console.log('Added cancellation_reason');
    }

    if (!tableDesc.cancellation_remarks) {
      await queryInterface.addColumn('orders', 'cancellation_remarks', {
        type: sequelize.Sequelize.TEXT,
        allowNull: true,
      });
      console.log('Added cancellation_remarks');
    }

    if (!tableDesc.cancelled_at) {
      await queryInterface.addColumn('orders', 'cancelled_at', {
        type: sequelize.Sequelize.DATE,
        allowNull: true,
      });
      console.log('Added cancelled_at');
    }

    if (!tableDesc.cancelled_by) {
      await queryInterface.addColumn('orders', 'cancelled_by', {
        type: sequelize.Sequelize.UUID,
        allowNull: true,
      });
      console.log('Added cancelled_by');
    }

    if (!tableDesc.refund_status) {
      await queryInterface.addColumn('orders', 'refund_status', {
        type: sequelize.Sequelize.STRING(50),
        allowNull: true,
      });
      console.log('Added refund_status');
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
