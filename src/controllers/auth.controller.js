import User from "../models/user.js";
import { loginSchema, registerSchema } from "../validations/user.validation.js";
import { generateToken } from "../helpers/utilities.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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

export {
  loginUser,
  registerUser,
  refreshUserToken,
  logoutUser
}