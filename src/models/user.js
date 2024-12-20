import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true 
  },
  username: {
    type: String,
    required: true
  },
  image: {
    public_id: String,
    secure_url: String
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
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  ],
  savedPosts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  ],
  communities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    }
  ]
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;