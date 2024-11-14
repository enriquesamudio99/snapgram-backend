import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String, 
    enum: ['like', 'share', 'follow'], 
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;