import mongoose from 'mongoose';

const postSchema = mongoose.Schema({
  caption: {
    type: String,
    required: true 
  },
  images: [
    {
      public_id: String,
      secure_url: String
    }
  ],
  location: {
    type: String,
    required: true
  },
  tags: [
    {
      type: String
    }
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Post = mongoose.model('Post', postSchema);

export default Post;