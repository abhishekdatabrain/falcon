const { Customer, User, Address, sequelize } = require('../models');

class CustomerService {
  async getProfile(userId) {
    return await Customer.findOne({
      where: { user_id: userId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'role', 'status'] },
        { model: Address, as: 'addresses' },
      ],
    });
  }

  async updateProfile(customerId, data) {
    const { first_name, last_name, mobile } = data;
    const customer = await Customer.findByPk(customerId, {
      include: [{ model: User, as: 'user' }],
    });

    if (!customer) {
      throw new Error('Customer profile not found');
    }

    return await sequelize.transaction(async (t) => {
      if (first_name || last_name) {
        await customer.update({
          first_name: first_name || customer.first_name,
          last_name: last_name || customer.last_name,
        }, { transaction: t });
      }

      if (mobile && mobile !== customer.user.mobile) {
        const existingMobile = await User.findOne({ where: { mobile } });
        if (existingMobile) {
          throw new Error('Mobile number already in use');
        }
        await customer.user.update({ mobile }, { transaction: t });
      }

      return await this.getProfile(customer.user_id);
    });
  }

  async getAddresses(customerId) {
    return await Address.findAll({
      where: { customer_id: customerId },
      order: [['is_default', 'DESC'], ['createdAt', 'DESC']],
    });
  }

  async addAddress(customerId, data) {
    const { full_name, mobile, country, state, city, area, address_line, postal_code, latitude, longitude, is_default } = data;

    return await sequelize.transaction(async (t) => {
      if (is_default) {
        await Address.update({ is_default: false }, { where: { customer_id: customerId }, transaction: t });
      }

      // If first address, make default automatically
      const count = await Address.count({ where: { customer_id: customerId }, transaction: t });
      const makeDefault = is_default || count === 0;

      const address = await Address.create({
        customer_id: customerId,
        full_name,
        mobile,
        country: country || 'Saudi Arabia',
        state,
        city,
        area,
        address_line,
        postal_code,
        latitude,
        longitude,
        is_default: makeDefault,
      }, { transaction: t });

      return address;
    });
  }

  async updateAddress(customerId, addressId, data) {
    const address = await Address.findOne({ where: { id: addressId, customer_id: customerId } });
    if (!address) {
      throw new Error('Address not found');
    }

    return await sequelize.transaction(async (t) => {
      if (data.is_default) {
        await Address.update({ is_default: false }, { where: { customer_id: customerId }, transaction: t });
      }

      await address.update(data, { transaction: t });
      return address;
    });
  }

  async deleteAddress(customerId, addressId) {
    const address = await Address.findOne({ where: { id: addressId, customer_id: customerId } });
    if (!address) {
      throw new Error('Address not found');
    }
    await address.destroy();
    return true;
  }
}

module.exports = new CustomerService();
