const express = require('express');
const router = express.Router();
const { getProfiles, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.get('/', getProfiles);
router.put('/:id', protect, updateProfile);

module.exports = router;
