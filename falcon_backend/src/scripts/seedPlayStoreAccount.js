const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Op } = require('sequelize');
const { sequelize, User, Customer, Address } = require('../models');
const { hashPassword } = require('../utils/password');
const ROLES = require('../constants/roles');

const DUMMY_ACCOUNT = {
  mobile: '551234567',
  email: 'playstore.reviewer@saqrcart.com',
  username: 'playstore_reviewer',
  password: '123456789',
  firstName: 'Google Play',
  lastName: 'Reviewer',
  address: {
    full_name: 'Google Play Reviewer',
    mobile: '0551234567',
    country: 'Saudi Arabia',
    state: 'Riyadh Province',
    city: 'Riyadh',
    area: 'Al Malqa',
    address_line: 'Building 42, Anas Ibn Malik Road, Al Malqa',
    postal_code: '13524',
    latitude: 24.7742,
    longitude: 46.6385,
    is_default: true,
  },
};

/**
 * Idempotently seeds the Google Play Store reviewer customer account,
 * its Customer profile, and a default Riyadh delivery address.
 */
async function seedPlayStoreAccount() {
  await sequelize.authenticate();
  const passwordHash = await hashPassword(DUMMY_ACCOUNT.password);

  const result = await sequelize.transaction(async (t) => {
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { mobile: DUMMY_ACCOUNT.mobile },
          { email: DUMMY_ACCOUNT.email },
          { username: DUMMY_ACCOUNT.username },
        ],
      },
      transaction: t,
    });

    if (user) {
      await user.update(
        {
          mobile: DUMMY_ACCOUNT.mobile,
          email: DUMMY_ACCOUNT.email,
          username: DUMMY_ACCOUNT.username,
          password_hash: passwordHash,
          role: ROLES.CUSTOMER,
          status: 'ACTIVE',
        },
        { transaction: t }
      );
    } else {
      user = await User.create(
        {
          mobile: DUMMY_ACCOUNT.mobile,
          email: DUMMY_ACCOUNT.email,
          username: DUMMY_ACCOUNT.username,
          password_hash: passwordHash,
          role: ROLES.CUSTOMER,
          status: 'ACTIVE',
        },
        { transaction: t }
      );
    }

    let customer = await Customer.findOne({
      where: { user_id: user.id },
      transaction: t,
    });

    if (!customer) {
      customer = await Customer.create(
        {
          user_id: user.id,
          first_name: DUMMY_ACCOUNT.firstName,
          last_name: DUMMY_ACCOUNT.lastName,
        },
        { transaction: t }
      );
    }

    let address = await Address.findOne({
      where: { customer_id: customer.id },
      transaction: t,
    });

    if (!address) {
      address = await Address.create(
        {
          customer_id: customer.id,
          ...DUMMY_ACCOUNT.address,
        },
        { transaction: t }
      );
    }

    return { user, customer, address };
  });

  console.log('Play Store dummy account ready:', {
    userId: result.user.id,
    mobile: result.user.mobile,
    email: result.user.email,
    username: result.user.username,
    status: result.user.status,
    customerId: result.customer.id,
    addressId: result.address.id,
  });
}

seedPlayStoreAccount()
  .catch((err) => {
    console.error('Failed to seed Play Store dummy account:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
