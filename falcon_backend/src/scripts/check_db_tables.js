const { sequelize } = require('../models');

async function checkTables() {
  await sequelize.authenticate();
  const [results] = await sequelize.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name IN ('users', 'admins', 'roles', 'permissions', 'role_permissions', 'admin_user_roles', 'audit_logs')
    ORDER BY table_schema, table_name;
  `);
  console.log('Matched tables:', results);
  process.exit(0);
}
checkTables().catch(e => { console.error(e); process.exit(1); });
