const contactService = require('../services/contactService');
const { sendSuccess, sendError } = require('../utils/response');

class ContactController {
  // Public Endpoints
  async getPublicContactData(req, res) {
    try {
      const data = await contactService.getPublicContactPageData();
      return sendSuccess(res, 'Contact page data retrieved', data);
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  async getActiveCategories(req, res) {
    try {
      const categories = await contactService.getActiveCategories();
      return sendSuccess(res, 'Inquiry categories retrieved', { categories });
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  async getActiveLocations(req, res) {
    try {
      const locations = await contactService.getActiveLocations();
      return sendSuccess(res, 'Office locations retrieved', { locations });
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  async submitTicket(req, res) {
    try {
      const ticket = await contactService.submitTicket(req.body, req.user || null);
      return sendSuccess(res, 'Support ticket submitted successfully', { ticket }, 201);
    } catch (error) {
      return sendError(
        res,
        error.message,
        error.fieldErrors ? Object.values(error.fieldErrors) : [],
        error.statusCode || 400,
        { fieldErrors: error.fieldErrors || {} }
      );
    }
  }

  // Admin Endpoints
  async getAdminSettings(req, res) {
    try {
      const settings = await contactService.getAdminSettings();
      return sendSuccess(res, 'Contact settings retrieved', { settings });
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  async updateAdminSettings(req, res) {
    try {
      const settings = await contactService.updateAdminSettings(req.body, req.user.id);
      return sendSuccess(res, 'Contact settings updated successfully', { settings });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getAllCategories(req, res) {
    try {
      const categories = await contactService.getAllCategories();
      return sendSuccess(res, 'All inquiry categories retrieved', { categories });
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  async createCategory(req, res) {
    try {
      const category = await contactService.createCategory(req.body);
      return sendSuccess(res, 'Inquiry category created', { category }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateCategory(req, res) {
    try {
      const category = await contactService.updateCategory(req.params.id, req.body);
      return sendSuccess(res, 'Inquiry category updated', { category });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async deleteCategory(req, res) {
    try {
      await contactService.deleteCategory(req.params.id);
      return sendSuccess(res, 'Inquiry category deleted');
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getAllLocations(req, res) {
    try {
      const locations = await contactService.getAllLocations();
      return sendSuccess(res, 'All office locations retrieved', { locations });
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  async createLocation(req, res) {
    try {
      const location = await contactService.createLocation(req.body);
      return sendSuccess(res, 'Office location created', { location }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateLocation(req, res) {
    try {
      const location = await contactService.updateLocation(req.params.id, req.body);
      return sendSuccess(res, 'Office location updated', { location });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async deleteLocation(req, res) {
    try {
      await contactService.deleteLocation(req.params.id);
      return sendSuccess(res, 'Office location deleted');
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getAdminTickets(req, res) {
    try {
      const data = await contactService.getAdminTickets(req.query);
      return sendSuccess(res, 'Support tickets retrieved', data);
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  async getAdminTicketById(req, res) {
    try {
      const ticket = await contactService.getAdminTicketById(req.params.id);
      return sendSuccess(res, 'Support ticket retrieved', { ticket });
    } catch (error) {
      return sendError(res, error.message, [], 404);
    }
  }

  async updateAdminTicket(req, res) {
    try {
      const ticket = await contactService.updateAdminTicket(req.params.id, req.body, req.user.id);
      return sendSuccess(res, 'Support ticket updated', { ticket });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new ContactController();
