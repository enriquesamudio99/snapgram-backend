import User from "../models/user.js";
import Notification from "../models/notification.js";
import { validateObjectId } from "../helpers/utilities.js";
import mongoose from "mongoose";

const getUsers = async (req, res) => {
  const { searchTerm, sort } = req.query;
  const userId = req.user._id;

  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 9;
  const skipAmount = (page - 1) * limit;

  try {
    const query = {};   
    query._id = { $ne: userId };
    
    if(searchTerm) {
      const escapedSearchQuery = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: new RegExp(escapedSearchQuery, 'i') }},
        { username: { $regex: new RegExp(escapedSearchQuery, 'i') }},
      ]
    }

    let sortOptions = {}; 

    switch (sort) {
      case "new_users":
        sortOptions = { createdAt: -1 }
        break;
      case "old_users":
        sortOptions = { createdAt: 1 }
        break;
      default:
        sortOptions = { createdAt: -1 }
        break;
    }

    const users = await User.find(query)
      .select({
        password: 0,
        refreshToken: 0,
        resetPasswordExpires: 0,
        resetPasswordToken: 0
      })  
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);
    const hasNextPage = totalUsers > skipAmount + users.length; 
    
    return res.json({
      success: true,
      users,
      totalUsers,
      nextPage: hasNextPage ? page + 1 : null,
      hasNextPage
    });
  } catch (error) {
    console.log(error);
  }
}

const getUsersByCreatedPosts = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id); 

  try {
    const query = { _id: { $ne: userId } };

    const users = await User.aggregate([
      {
        $project: {
          postCount: { $size: "$posts" },
          name: 1,
          username: 1,
          image: 1,
          email: 1,
          bio: 1,
          followers: 1,
          following: 1,
          communities: 1,
          savedPosts: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      {
        $match: query
      },
      {
        $sort: { postCount: -1 }
      },
      {
        $limit: 8
      }
    ]);
    
    return res.json({
      success: true,
      users
    });
  } catch (error) { 
    console.log(error);
  }
}

const getUser = async (req, res) => {

  const { userId } = req.params;

  const isValidId = validateObjectId(userId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {
    const user = await User.findById(userId).select({
      password: 0,
      refreshToken: 0,
      resetPasswordExpires: 0,
      resetPasswordToken: 0
    });

    if (!user) {  
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    return res.json({
      success: true,
      user
    })
  } catch (error) {
    console.log(error);
  }
}

const getCurrentUser = async (req, res) => {

  const userId = req.user._id;

  try {
    const user = await User.findById(userId).select({
      password: 0,
      refreshToken: 0,
      resetPasswordExpires: 0,
      resetPasswordToken: 0
    });

    if (!user) {  
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    return res.json({
      success: true,
      user
    })
  } catch (error) {
    console.log(error);
  }
}

const followUser = async (req, res) => {

  const { followUserId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(followUserId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  if (followUserId === userId) {  
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  }
  
  try {
    const userToFollow = await User.findById(followUserId);
    const user = await User.findById(userId);

    if (!userToFollow || !user) {  
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    if (user.following.includes(userToFollow._id)) {
      return res.status(404).json({
        success: false,
        error: 'You already follow this user.'
      });
    }

    await User.findByIdAndUpdate(
      user._id,
      {
        $push: {
          following: userToFollow._id
        }
      }
    );

    await User.findByIdAndUpdate(
      userToFollow._id,
      {
        $push: {
          followers: user._id
        }
      }
    );

    // Create Notification
    const notification = new Notification({ 
      userId: userToFollow._id,
      senderId: userId,
      type: "follow",
      content: `${user.name} followed you`
    });
    await notification.save();
    
    return res.json({
      success: true,
      userId: user._id,
      followingId: userToFollow._id
    });
  } catch (error) {
    console.log(error);
  }
}

const unfollowUser = async (req, res) => {

  const { unfollowUserId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(unfollowUserId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  if (unfollowUserId === userId) {  
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  }

  try {
    const userToUnfollow = await User.findById(unfollowUserId);
    const user = await User.findById(userId);

    if (!userToUnfollow || !user) {  
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    if (!user.following.includes(userToUnfollow._id)) {
      return res.status(404).json({
        success: false,
        error: 'You do not follow this user.'
      });
    }

    await User.findByIdAndUpdate(
      user._id,
      {
        $pull: {
          following: userToUnfollow._id
        }
      }
    );

    await User.findByIdAndUpdate(
      userToUnfollow._id,
      {
        $pull: {
          followers: user._id
        }
      }
    );

    return res.json({
      success: true,
      userId: user._id,
      unfollowingId: userToUnfollow._id
    });
  } catch (error) {
    console.log(error);
  }
}

export {
  getUsers,
  getUsersByCreatedPosts,
  getUser,
  getCurrentUser,
  followUser,
  unfollowUser
}