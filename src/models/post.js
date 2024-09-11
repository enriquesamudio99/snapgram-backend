import mongoose from 'mongoose';

const postSchema = mongoose.Schema({
  caption: {
    type: String,
    required: function () {
      return this.originalPost === null;
    } 
  },
  images: [
    {
      public_id: String,
      secure_url: String
    }
  ],
  location: {
    type: String,
    required: function () {
      return this.originalPost === null;
    } 
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
  },
  sharedBy: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  originalPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment' 
    }
  ]
}, {
  timestamps: true
});

const Post = mongoose.model('Post', postSchema);

export default Post;