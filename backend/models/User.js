const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String, 
    default: ''
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password function
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Auto-create profile on signup (equivalent to Supabase handle_new_user trigger)
userSchema.post('save', async function(doc, next) {
  try {
    const Profile = mongoose.model('Profile');
    // Check if profile already exists for this user to avoid duplicates on updates
    const existingProfile = await Profile.findOne({ user: doc._id });
    if (!existingProfile) {
      await Profile.create({
        user: doc._id,
        name: doc.name || '',
        email: doc.email
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
