const customerService = require('../services/customerService');
const { sendSuccess, sendError } = require('../utils/response');

class CustomerController {
  async getProfile(req, res, next) {
    try {
      const profile = await customerService.getProfile(req.user.id);
      return sendSuccess(res, 'Profile retrieved', { profile });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const customerId = req.user.customer.id;
      const profile = await customerService.updateProfile(customerId, req.body);
      return sendSuccess(res, 'Profile updated', { profile });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getAddresses(req, res, next) {
    try {
      let customerId = req.user?.customer?.id;
      if (!customerId) {
        const { Customer } = require('../models');
        let customer = await Customer.findOne({ where: { user_id: req.user.id } });
        if (!customer) {
          customer = await Customer.create({
            user_id: req.user.id,
            first_name: req.user.email ? req.user.email.split('@')[0] : 'Customer',
            last_name: '',
          });
        }
        customerId = customer.id;
      }
      const addresses = await customerService.getAddresses(customerId);
      return sendSuccess(res, 'Addresses retrieved', { addresses });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async addAddress(req, res, next) {
    try {
      let customerId = req.user?.customer?.id;
      if (!customerId) {
        const { Customer } = require('../models');
        let customer = await Customer.findOne({ where: { user_id: req.user.id } });
        if (!customer) {
          customer = await Customer.create({
            user_id: req.user.id,
            first_name: req.user.email ? req.user.email.split('@')[0] : 'Customer',
            last_name: '',
          });
        }
        customerId = customer.id;
      }

      const { full_name, mobile, city, area, address_line } = req.body;
      if (!full_name || !mobile || !city || !area || !address_line) {
        return sendError(res, 'Full name, mobile, city, area, and address line are required', [], 400);
      }

      const body = {
        ...req.body,
        state: req.body.state || city || 'Riyadh',
        country: req.body.country || 'Saudi Arabia',
      };

      const address = await customerService.addAddress(customerId, body);
      return sendSuccess(res, 'Address added successfully', { address }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateAddress(req, res, next) {
    try {
      let customerId = req.user?.customer?.id;
      if (!customerId) {
        const { Customer } = require('../models');
        let customer = await Customer.findOne({ where: { user_id: req.user.id } });
        if (!customer) {
          customer = await Customer.create({
            user_id: req.user.id,
            first_name: req.user.email ? req.user.email.split('@')[0] : 'Customer',
            last_name: '',
          });
        }
        customerId = customer.id;
      }
      const { addressId } = req.params;
      const address = await customerService.updateAddress(customerId, addressId, req.body);
      return sendSuccess(res, 'Address updated successfully', { address });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async deleteAddress(req, res, next) {
    try {
      let customerId = req.user?.customer?.id;
      if (!customerId) {
        const { Customer } = require('../models');
        let customer = await Customer.findOne({ where: { user_id: req.user.id } });
        if (!customer) {
          customer = await Customer.create({
            user_id: req.user.id,
            first_name: req.user.email ? req.user.email.split('@')[0] : 'Customer',
            last_name: '',
          });
        }
        customerId = customer.id;
      }
      const { addressId } = req.params;
      await customerService.deleteAddress(customerId, addressId);
      return sendSuccess(res, 'Address deleted successfully');
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new CustomerController();
