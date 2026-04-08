const Profile = require('../models/Profile');

// @desc    Get all profiles
// @route   GET /api/profiles
// @access  Public (matching Supabase basic select true)
const getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', 'email name');
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/profiles/:id
// @access  Private (auth.uid() = user_id)
const updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check for user ownership (Supabase RLS: auth.uid() = user_id)
    if (profile.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to update this profile' });
    }

    const updatedProfile = await Profile.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfiles,
  updateProfile
};
