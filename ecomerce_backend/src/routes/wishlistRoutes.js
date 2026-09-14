const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => wishlistController.getWishlist(req, res));
router.post('/toggle', (req, res) => wishlistController.toggleWishlist(req, res));
router.delete('/:productId', (req, res) => wishlistController.removeFromWishlist(req, res));

module.exports = router;
