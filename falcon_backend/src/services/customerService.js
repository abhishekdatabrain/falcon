const { Customer, User, Address, Order, Wishlist, sequelize } = require('../models');
const { Op } = require('sequelize');

class CustomerService {
  async getProfile(userId) {
    let customer = await Customer.findOne({
      where: { user_id: userId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'role', 'status'] },
        { model: Address, as: 'addresses' },
      ],
    });

    if (!customer) {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');
      customer = await Customer.create({
        user_id: userId,
        first_name: user.email ? user.email.split('@')[0] : 'Customer',
        last_name: '',
      });
      customer = await Customer.findByPk(customer.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'email', 'mobile', 'role', 'status'] },
          { model: Address, as: 'addresses' },
        ],
      });
    }

    // Dynamic stats computation
    const [totalOrders, activeOrders, totalSpentRaw, wishlistCount] = await Promise.all([
      Order ? Order.count({ where: { customer_id: customer.id } }).catch(() => 0) : 0,
      Order ? Order.count({
        where: {
          customer_id: customer.id,
          order_status: { [Op.in]: ['CONFIRMED', 'PROCESSING', 'PACKED', 'DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED'] }
        }
      }).catch(() => 0) : 0,
      Order ? Order.sum('grand_total', { where: { customer_id: customer.id, order_status: 'DELIVERED' } }).catch(() => 0) : 0,
      Wishlist ? Wishlist.count({ where: { user_id: userId } }).catch(() => 0) : 0,
    ]);

    const totalSpent = parseFloat(totalSpentRaw || 0);
    const martPoints = Math.round(totalSpent * 2) + 120; // 2 points per SAR + 120 welcome bonus
    const martPointsVal = (martPoints * 0.05).toFixed(2); // 1 point = 0.05 SAR

    let tier = '🥉 BRONZE';
    let tierTitle = 'Bronze Member';
    if (totalSpent > 1000) {
      tier = '👑 GOLD VIP';
      tierTitle = 'Gold Privilege';
    } else if (totalSpent > 400) {
      tier = '🥈 SILVER VIP';
      tierTitle = 'Silver VIP';
    }

    const customerJson = customer.toJSON ? customer.toJSON() : customer;
    customerJson.stats = {
      totalOrders: totalOrders || 0,
      activeOrders: activeOrders || 0,
      totalSpent: totalSpent || 0,
      martPoints: martPoints || 120,
      martPointsVal: martPointsVal || '6.00',
      tier: tier,
      tierTitle: tierTitle,
      wishlistCount: wishlistCount || 0,
      addressesCount: customer.addresses ? customer.addresses.length : 0,
      tierSavings: Math.round(totalSpent * 0.1) || 45,
    };

    return customerJson;
  }

  async updateProfile(customerId, data) {
    const {
      first_name,
      last_name,
      email,
      mobile,
      dob,
      gender,
      national_id,
      avatar_url,
      preferences,
    } = data;

    const customer = await Customer.findByPk(customerId, {
      include: [{ model: User, as: 'user' }],
    });

    if (!customer) {
      throw new Error('Customer profile not found');
    }

    await sequelize.transaction(async (t) => {
      const updatePayload = {};
      if (first_name !== undefined) updatePayload.first_name = first_name;
      if (last_name !== undefined) updatePayload.last_name = last_name;
      if (dob !== undefined) updatePayload.dob = dob;
      if (gender !== undefined) updatePayload.gender = gender;
      if (national_id !== undefined) updatePayload.national_id = national_id;
      if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url;
      if (preferences !== undefined) {
        updatePayload.preferences = {
          ...(customer.preferences || {}),
          ...preferences,
        };
      }

      if (Object.keys(updatePayload).length > 0) {
        await customer.update(updatePayload, { transaction: t });
      }

      if (mobile && mobile !== customer.user.mobile) {
        const existingMobile = await User.findOne({ where: { mobile } });
        if (existingMobile && existingMobile.id !== customer.user_id) {
          throw new Error('Mobile number already in use');
        }
        await customer.user.update({ mobile }, { transaction: t });
      }

      if (email && email !== customer.user.email) {
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail && existingEmail.id !== customer.user_id) {
          throw new Error('Email address already in use');
        }
        await customer.user.update({ email }, { transaction: t });
      }
    });

    return await this.getProfile(customer.user_id);
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
