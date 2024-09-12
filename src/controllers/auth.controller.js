import User from "../models/user.js";
import { loginSchema, registerSchema, updatePasswordSchema, updateSchema } from "../validations/user.validation.js";
import { generateRandomToken, generateToken, validateObjectId } from "../helpers/utilities.js";
import bcrypt from 'bcrypt';
import { forgetPasswordEmail } from '../helpers/email.js';
 
const loginUser = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  }

  try {
    const userExists = await User.findOne({
      email: value.email
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: 'There is no user registered with this email.'
      });
    }

    const validatePassword = await bcrypt.compare(value.password, userExists.password);

    if (!validatePassword) {
      return res.status(404).json({
        success: false,
        error: 'Invalid password.'
      });
    }

    userExists.password = undefined;

    // JWT
    const accessToken = generateToken({
      _id: userExists._id,
      name: `${userExists.firstName} ${userExists.lastName}`,
      username: userExists.username,
      email: userExists.email,
      bio: userExists.bio,
    });

    return res.status(200).json({
      success: true,
      token: accessToken, 
      user: {
        id: userExists._id,
        name: `${userExists.firstName} ${userExists.lastName}`,
        username: userExists.username,
        email: userExists.email,
        bio: userExists.bio
      }
    });
  } catch (error) {
    console.log(error);
  }
}

const registerUser = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);

  if (error) {
    console.log(error);
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  } 

  try {
    const userExists = await User.findOne({
      email: value.email
    });

    if (userExists) {
      return res.status(404).json({
        success: false,
        error: 'There is already a registered user with this email address.'
      });
    }

    const usernameInUse = await User.findOne({
      username: value.username
    });
 
    if (usernameInUse) { 
      return res.status(404).json({
        success: false,
        error: 'This username is already in use.'
      });
    }

    const user = new User(value);

    // Hash Password
    const salt = bcrypt.genSaltSync(); 
    user.password = bcrypt.hashSync(value.password, salt);

    const result = await user.save();

    result.password = undefined;

    // JWT
    const accessToken = generateToken({
      _id: result._id,
      name: `${result.firstName} ${result.lastName}`,
      username: result.username,
      email: result.email,
      bio: result.bio
    });

    return res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        id: result._id,
        name: `${result.firstName} ${result.lastName}`,
        username: result.username,
        email: result.email,
        bio: result.bio
      }
    });
  } catch (error) {
    console.log(error);
  }
}

const refreshUserToken = async (req, res) => {

  const { _id, name, username, email, bio } = req.user;

  try {
    // JWT
    const accessToken = generateToken({
      _id,
      name,
      username,
      email,
      bio
    });

    return res.json({
      success: true,
      token: accessToken,
      user: {
        id: _id,
        name,
        username,
        email,
        bio
      }
    });

  } catch (error) {
    console.log(error);
    
    return res.status(401).json({
      error: 'Invalid token.'
    });
  }
}

const updateUser = async (req, res) => {

  const { userId } = req.params;

  const isValidId = validateObjectId(userId);
  
  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  const { error, value } = updateSchema.validate(req.body);

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {  
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    if (value.email !== user.email) {
      const emailInUse = await User.findOne({
        email: value.email
      });
  
      if (emailInUse) {
        return res.status(404).json({
          success: false,
          error: 'There is already a registered user with this email address.'
        });
      }
    }

    if (value.username !== user.username) {
      const usernameInUse = await User.findOne({
        username: value.username
      });
  
      if (usernameInUse) {
        return res.status(404).json({
          success: false,
          error: 'This username is already in use.'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, value, { new: true });

    return res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.log(error);
  }
}

const updateUserPassword = async (req, res) => {
  const { userId } = req.params;

  const isValidId = validateObjectId(userId);
  
  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  const { error, value } = updatePasswordSchema.validate(req.body);

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {  
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    const validatePassword = await bcrypt.compare(value.oldPassword, user.password);

    if (!validatePassword) {
      return res.status(404).json({
        success: false,
        error: 'Invalid old password.'
      });
    }

    // Hash Password
    const salt = bcrypt.genSaltSync(); 
    user.password = bcrypt.hashSync(value.password, salt);

    await user.save();

    return res.json({
      success: true,
      message: 'Password successfully updated.'
    });
  } catch (error) {
    console.log(error);
  }
}

const deleteUser = async (req, res) => {
  const { userId } = req.params;

  const isValidId = validateObjectId(userId);
  
  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }
 
  try {
    
    const user = await User.findByIdAndDelete(userId);

    if (!user) {  
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    return res.json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    console.log(error);
  }
}

const createResetPasswordToken = async (req, res) => {

  const { email } = req.body;

  try {
    const user = await User.findOne({ email }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'There is no user registered with this email.'
      });
    }

    user.resetPasswordToken = generateRandomToken();
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;

    await user.save();

    forgetPasswordEmail({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      token: user.resetPasswordToken
    })

    return res.json({
      success: true,
      message: 'Check your email for instructions.'
    });
  } catch (error) {
    console.log(error);
  }
}

const resetUserPassword = async (req, res) => {

  const { token } = req.params;

  const { error, value } = updatePasswordSchema.validate(req.body);

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  }

  try {
    const user = await User.findOne({ 
      resetPasswordToken: token, 
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Invalid token or no user registered with this email address.'
      });
    }

    // Hash Password
    const salt = bcrypt.genSaltSync(); 
    user.password = bcrypt.hashSync(value.password, salt);

    // Delete token
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.json({
      success: true,
      message: 'Password successfully reset.'
    });
  } catch (error) {
    console.log(error);
  }
}

export {
  loginUser,
  registerUser,
  refreshUserToken,
  updateUser,
  updateUserPassword,
  deleteUser,
  createResetPasswordToken,
  resetUserPassword
}