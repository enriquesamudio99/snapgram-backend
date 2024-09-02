import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true 
  }, 
  lastName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  bio: {
    type: String,
    default: "My bio"
  },
  password: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: String
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;