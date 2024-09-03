import User from "../models/user.js";
import { loginSchema, registerSchema, updatePasswordSchema, updateSchema } from "../validations/user.validation.js";
import { generateRandomToken, generateToken, validateObjectId } from "../helpers/utilities.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { forgetPasswordEmail } from '../helpers/email.js';
import { SECRET_WORD } from "../config/env.js";
 
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

    // Refresh Token
    const refreshToken = generateToken({
      _id: userExists._id,
      name: `${userExists.firstName} ${userExists.lastName}`,
      email: userExists.email,
      bio: userExists.bio
    });

    await User.findByIdAndUpdate(userExists._id, { refreshToken }, { new: true });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000
    });

    userExists.password = undefined;

    // JWT
    const accessToken = generateToken({
      _id: userExists._id,
      name: `${userExists.firstName} ${userExists.lastName}`,
      email: userExists.email,
      bio: userExists.bio,
    });

    return res.status(200).json({
      success: true,
      token: accessToken
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

    // Refresh Token
    const refreshToken = generateToken({
      _id: result._id,
      name: `${result.firstName} ${result.lastName}`,
      email: result.email,
      bio: result.bio
    });

    await User.findByIdAndUpdate(result._id, { refreshToken }, { new: true });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000
    });

    result.password = undefined;

    // JWT
    const accessToken = generateToken({
      _id: result._id,
      name: `${result.firstName} ${result.lastName}`,
      email: result.email,
      bio: result.bio
    });

    return res.status(200).json({
      success: true,
      token: accessToken
    });
  } catch (error) {
    console.log(error);
  }
}

const refreshUserToken = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.refreshToken) {
    return res.status(404).json({
      success: false,
      error: 'No refresh token.'
    });
  }

  const refreshToken = cookies?.refreshToken;
  
  const userWithToken = await User.findOne({ refreshToken });

  if (!userWithToken) {
    return res.status(404).json({
      success: false,
      error: 'Token not found.'
    });
  }
 
  try {
    
    const decodedData = jwt.verify(refreshToken, SECRET_WORD);

    if (!userWithToken._id.equals(decodedData._id)) {
      return res.status(401).json({
        error: 'Something wrong.'
      });
    }

    const updatedRefreshToken = generateToken({
      _id: userWithToken._id,
      name: `${userWithToken.firstName} ${userWithToken.lastName}`,
      email: userWithToken.email,
      bio: userWithToken.bio
    });

    await User.findByIdAndUpdate(userWithToken._id, { refreshToken: updatedRefreshToken }, { new: true });

    res.cookie('refreshToken', updatedRefreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      token: updatedRefreshToken
    });

  } catch (error) {
    console.log(error);
    
    return res.status(401).json({
      error: 'Invalid token.'
    });
  }
}

const logoutUser = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.refreshToken) {
    return res.status(404).json({
      success: false,
      error: 'No refresh token.'
    });
  }

  const refreshToken = cookies?.refreshToken;

  const userWithToken = await User.findOne({ refreshToken });

  if (!userWithToken) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true
    });

    return res.sendStatus(204);
  }

  try {

    await User.findOneAndUpdate({ refreshToken }, { refreshToken: "" });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true
    });

    return res.sendStatus(204);
    
  } catch (error) {
    console.log(error);
  }
}

const updateUser = async (req, res) => {

  const { id } = req.params;

  const isValidId = validateObjectId(id);
  
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
    const user = await User.findById(id);

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

    const updatedUser = await User.findByIdAndUpdate(id, value, { new: true });

    return res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.log(error);
  }
}

const updateUserPassword = async (req, res) => {
  const { id } = req.params;

  const isValidId = validateObjectId(id);
  
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
    const user = await User.findById(id);

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
  const { id } = req.params;

  const isValidId = validateObjectId(id);
  
  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }
 
  try {
    
    const user = await User.findByIdAndDelete(id);

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
  logoutUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  createResetPasswordToken,
  resetUserPassword
}