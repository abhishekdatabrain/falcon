const aboutPageService = require('../services/aboutPageService');
const { sendSuccess, sendError } = require('../utils/response');

class AboutPageController {
  async getPublicAboutPage(req, res) {
    try {
      const about = await aboutPageService.getAboutPageContent();
      return sendSuccess(res, 'About page content retrieved', { about });
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  async getAdminAboutPage(req, res) {
    try {
      const about = await aboutPageService.getAboutPageContent();
      return sendSuccess(res, 'About page content retrieved', { about });
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  async updateAdminAboutPage(req, res) {
    try {
      const about = await aboutPageService.updateAboutPageContent(req.body, req.user.id);
      return sendSuccess(res, 'About page content updated successfully', { about });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new AboutPageController();
