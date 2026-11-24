const { Customer, User, Address, Order, Wishlist, Cart, CartItem, DeviceToken, RefreshToken, sequelize } = require('../models');
const { Op } = require('sequelize');

class CustomerService {
  async getProfile(userId) {
    let customer = await Customer.findOne({
      where: { user_id: userId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'mobile', 'role', 'status'] },
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
          { model: User, as: 'user', attributes: ['id', 'username', 'email', 'mobile', 'role', 'status'] },
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
      username,
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

      if (username !== undefined && username !== null) {
        const cleanUsername = String(username).trim().toLowerCase().replace(/[^\p{L}\p{N}_.-]/gu, '');
        if (cleanUsername && cleanUsername !== (customer.user.username || '').toLowerCase()) {
          const existingUser = await User.findOne({
            where: {
              [Op.and]: [
                sequelize.where(sequelize.fn('LOWER', sequelize.col('username')), cleanUsername),
                { id: { [Op.ne]: customer.user_id } },
              ],
            },
          });
          if (existingUser) {
            throw new Error('This username is already taken. Please choose another username.');
          }
          await customer.user.update({ username: cleanUsername }, { transaction: t });
        }
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
    const isUuid = typeof addressId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(addressId);
    if (!isUuid) {
      throw new Error('Invalid address ID');
    }

    const address = await Address.findOne({ where: { id: addressId, customer_id: customerId } });
    if (!address) {
      throw new Error('Address not found');
    }

    const wasDefault = address.is_default;

    // Soft delete: sets deleted_at timestamp (retains DB record for historical order integrity)
    if (wasDefault) {
      await address.update({ is_default: false });
    }
    await address.destroy();

    // If the deleted address was default, promote the newest remaining address to default
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        where: { customer_id: customerId },
        order: [['createdAt', 'DESC']],
      });
      if (nextAddress) {
        await nextAddress.update({ is_default: true });
      }
    }

    return true;
  }

  /**
   * Delete & Anonymize Customer Account (compliance with App Store & Saudi PDPL)
   *
   * @param {string} userId - User UUID
   * @param {string|null} password - Optional password confirmation
   */
  async deleteCustomerAccount(userId, password = null) {
    const user = await User.findByPk(userId, {
      include: [{ model: Customer, as: 'customer' }],
    });

    if (!user) {
      throw new Error('User account not found');
    }

    if (user.status === 'INACTIVE') {
      throw new Error('Account is already deactivated or deleted');
    }

    // Optional password verification if password was passed
    if (password) {
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new Error('Incorrect password. Please verify your password to confirm account deletion.');
      }
    }

    const customer = user.customer || await Customer.findOne({ where: { user_id: userId } });
    const customerId = customer ? customer.id : null;

    // Check for any active orders that are in progress
    if (customerId) {
      const activeOrderCount = await Order.count({
        where: {
          customer_id: customerId,
          order_status: {
            [Op.notIn]: ['DELIVERED', 'CANCELLED', 'RETURNED'],
          },
        },
      });

      if (activeOrderCount > 0) {
        throw new Error('Cannot delete account while you have active orders in progress. Please wait until your order is delivered or cancel it first.');
      }
    }

    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcryptjs');
    const now = Date.now();
    const randomizedHash = await bcrypt.hash(uuidv4(), 10);

    await sequelize.transaction(async (t) => {
      // 1. Delete Cart & Cart Items
      if (customerId) {
        const cart = await Cart.findOne({ where: { customer_id: customerId }, transaction: t });
        if (cart) {
          await CartItem.destroy({ where: { cart_id: cart.id }, transaction: t });
          await cart.destroy({ transaction: t });
        }
      }

      // 2. Delete Wishlist items
      await Wishlist.destroy({ where: { user_id: userId }, transaction: t });

      // 3. Delete FCM Device Tokens & Refresh Tokens
      await DeviceToken.destroy({ where: { user_id: userId }, transaction: t });
      await RefreshToken.destroy({ where: { user_id: userId }, transaction: t });

      // 4. Soft-delete saved addresses
      if (customerId) {
        await Address.destroy({ where: { customer_id: customerId }, transaction: t });
      }

      // 5. Anonymize Customer profile
      if (customer) {
        await customer.update(
          {
            first_name: 'Deleted',
            last_name: 'Customer',
            avatar_url: null,
            dob: null,
            gender: null,
            national_id: null,
            preferences: {},
          },
          { transaction: t }
        );
      }

      // 6. Anonymize User credentials & deactivate
      const shortId = userId.slice(0, 8);
      const anonymizedEmail = `deleted_${shortId}_${now}@deleted.saqrcart.com`;
      const anonymizedMobile = `deleted_${now}_${user.mobile ? user.mobile.slice(-4) : '0000'}`;
      const anonymizedUsername = `deleted_${shortId}_${now}`;

      await user.update(
        {
          email: anonymizedEmail,
          mobile: anonymizedMobile,
          username: anonymizedUsername,
          password_hash: randomizedHash,
          status: 'INACTIVE',
          address: null,
          company_name: null,
          vat_no: null,
          cr_no: null,
        },
        { transaction: t }
      );
    });

    return true;
  }
}

module.exports = new CustomerService();
