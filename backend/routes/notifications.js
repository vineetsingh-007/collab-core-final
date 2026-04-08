const express = require('express');
const router = express.Router();
const { getNotifications, updateNotification, createNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getNotifications)
  .post(protect, createNotification);

router.route('/:id')
  .put(protect, updateNotification);

module.exports = router;
