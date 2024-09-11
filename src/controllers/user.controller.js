import User from "../models/user.js";
import { validateObjectId } from "../helpers/utilities.js";

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select({
      password: 0,
      refreshToken: 0,
      resetPasswordExpires: 0,
      resetPasswordToken: 0
    });

    return res.json({
      success: true,
      data: users
    })
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
      data: user
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
    
    return res.json({
      success: true
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
      success: true
    });
  } catch (error) {
    console.log(error);
  }
}

export {
  getUsers,
  getUser,
  followUser,
  unfollowUser
}