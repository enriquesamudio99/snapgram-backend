import User from '../models/user.js';
import Community from '../models/community.js';
import { communitySchema } from "../validations/community.validation.js";
import { validateObjectId } from '../helpers/utilities.js';
import { deleteOneImage, uploadOneImage } from '../helpers/images.js';
import { deletePostsAndImages } from './post.controller.js';

const getCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .sort({ createdAt: -1 })
      .populate([
        {
          path: "createdBy",
          model: "User",
          select: "name username bio"
        }
      ]);

    return res.json({
      success: true,
      data: communities
    });
  } catch (error) {
    console.log(error);
  }
}

const getCommunity = async (req, res) => {
  const { communityId } = req.params;

  const isValidId = validateObjectId(communityId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {
    const community = await Community.findById(communityId);
    
    if (!community) {  
      return res.status(404).json({
        success: false,
        error: 'Community not found.'
      });
    }

    return res.json({
      success: true,
      data: community
    });
  } catch (error) {
    console.log(error);
  }
}

const createCommunity = async (req, res) => {

  const userId = req.user._id;

  const { error, value } = communitySchema.validate(req.body);

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  }

  try {
    const nameInUse = await Community.findOne({
      name: value.name
    });
 
    if (nameInUse) { 
      return res.status(404).json({
        success: false,
        error: 'This community name is already in use.'
      });
    }

    const usernameInUse = await Community.findOne({
      username: value.username
    });
 
    if (usernameInUse) { 
      return res.status(404).json({
        success: false,
        error: 'This community username is already in use.'
      });
    }

    let image = {};
    if (req.files.length === 1) {
      image = await uploadOneImage(req.files[0]);
    }

    // Create Community
    const community = new Community(value);
    community.createdBy = userId;
    community.members.push(userId);
    community.image = image ? image : null;

    const result = await community.save();

    // Update user
    await User.findByIdAndUpdate(
      userId, 
      {
        $push: { 
          communities: result._id 
        },
      } 
    );

    return res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.log(error);
  }
}

const updateCommunity = async (req, res) => {

  const { communityId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(communityId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  const { error, value } = communitySchema.validate(req.body);

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  }

  try {
    const community = await Community.findById(communityId);

    if (!community) {  
      return res.status(404).json({
        success: false,
        error: 'Community not found.'
      });
    }

    if (community.createdBy.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Unauthorized.'
      });
    }

    if (value.name !== community.name) {
      const nameInUse = await Community.findOne({
        name: value.name
      });
   
      if (nameInUse) { 
        return res.status(404).json({
          success: false,
          error: 'This community name is already in use.'
        });
      }
    }

    if (value.username !== community.username) {
      const usernameInUse = await Community.findOne({
        username: value.username
      });
   
      if (usernameInUse) { 
        return res.status(404).json({
          success: false,
          error: 'This community username is already in use.'
        });
      }
    }
 
    let image = undefined;
    if (req.files.length === 1) {
      await deleteOneImage(community.image.public_id);
      image = await uploadOneImage(req.files[0]);
    }
    
    // Update Community
    const updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      {
        ...value,
        image: image ? image : community.image
      },
      {
        new: true
      }
    );

    return res.json({
      success: true,
      data: updatedCommunity
    })
  } catch (error) {
    console.log(error);
  }
}

const deleteCommunity = async (req, res) => {

  const { communityId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(communityId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {
    const community = await Community.findById(communityId);

    if (!community) {  
      return res.status(404).json({
        success: false,
        error: 'Community not found.'
      });
    }

    if (community.createdBy.toString() !== userId) {  
      return res.status(404).json({
        success: false,
        error: 'Unauthorized.'
      });
    }

    // Update Users Communities
    await User.updateMany({ $pull: { communities: community._id } });

    // Delete Community Posts and Images
    await deletePostsAndImages(community.posts);

    if (community.image.public_id) {;
      await deleteOneImage(community.image.public_id);
    }

    // Delete Community 
    await community.deleteOne();

    return res.json({
      success: true,
      message: 'Community deleted successfully.'
    });
  } catch (error) {
    console.log(error);
  }
}

export {
  getCommunities,
  getCommunity,
  createCommunity,
  updateCommunity,
  deleteCommunity
}