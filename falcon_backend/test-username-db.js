require('dotenv').config();
const { User, Customer, sequelize } = require('./src/models');
const authService = require('./src/services/authService');

async function testUsernamePersistence() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const testUsername = `user_${Date.now().toString().slice(-6)}`;
    const testEmail = `${testUsername}@example.com`;
    const testMobile = `+9665${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testPassword = 'Password123!';

    console.log(`Registering customer with username: ${testUsername}`);
    const regResult = await authService.registerCustomer({
      username: testUsername,
      email: testEmail,
      mobile: testMobile,
      password: testPassword,
      first_name: 'Test',
      last_name: 'Customer',
    });

    console.log('Registration returned user:', {
      id: regResult.user.id,
      username: regResult.user.username,
      email: regResult.user.email,
    });

    // Directly query database table via raw SQL to be 100% sure it's in the DB
    const schema = process.env.SCHEMA || 'Abhishek';
    const [rawRows] = await sequelize.query(
      `SELECT id, username, email, mobile FROM "${schema}"."users" WHERE id = :id`,
      { replacements: { id: regResult.user.id } }
    );
    console.log('Raw DB query result:', rawRows[0]);

    if (rawRows[0]?.username === testUsername) {
      console.log('SUCCESS: username is successfully persisted in PostgreSQL users table!');
    } else {
      console.error('FAILURE: username mismatch in DB:', rawRows[0]);
    }

    // Test Login with username
    console.log('Testing login with username...');
    const loginResult = await authService.login(testUsername, testPassword);
    console.log('Login successful with username! User ID:', loginResult.user.id);

    // Test Duplicate username detection
    console.log('Testing duplicate username detection...');
    try {
      await authService.registerCustomer({
        username: testUsername,
        email: `another_${testEmail}`,
        mobile: `+9665${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: testPassword,
        first_name: 'Test2',
        last_name: 'Customer2',
      });
      console.error('FAILURE: Duplicate username was allowed!');
    } catch (dupErr) {
      console.log('SUCCESS: Duplicate username correctly rejected with error:', dupErr.message);
    }

    // Clean up test data
    await Customer.destroy({ where: { user_id: regResult.user.id } });
    await User.destroy({ where: { id: regResult.user.id } });
    console.log('Test cleanup complete');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await sequelize.close();
  }
}

testUsernamePersistence();
