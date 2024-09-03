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

  const { id } = req.params;

  const isValidId = validateObjectId(id);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {
    const user = await User.findById(id).select({
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

  const { id } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(id);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  if (id === userId) {  
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  }
  
  try {
    const userToFollow = await User.findById(id);
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

    user.following.push(userToFollow._id);
    await user.save();

    userToFollow.followers.push(user._id);
    await userToFollow.save();
    
    return res.json({
      success: true
    });
  } catch (error) {
    console.log(error);
  }
}

const unfollowUser = async (req, res) => {

  const { id } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(id);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  if (id === userId) {  
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  }

  try {
    const userToUnfollow = await User.findById(id);
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

    user.following = user.following.filter((userId) => userId.toString() !== userToUnfollow._id.toString());
    await user.save();

    userToUnfollow.followers = userToUnfollow.followers.filter((userId) => userId.toString() !== user._id.toString());
    await userToUnfollow.save();

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