import User from '../models/user.js';
import Community from '../models/community.js';
import { communitySchema } from "../validations/community.validation.js";
import { validateObjectId } from '../helpers/utilities.js';
import { deleteOneImage, uploadOneImage } from '../helpers/images.js';
import { deletePostsAndImages } from './post.controller.js';

const getCommunities = async (req, res) => {
  const { searchQuery, sort } = req.query;

  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skipAmount = (page - 1) * limit;

  try {
    const query = {};   
    
    if(searchQuery) {
      const escapedSearchQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: new RegExp(escapedSearchQuery, 'i') }},
        { username: { $regex: new RegExp(escapedSearchQuery, 'i') }}
      ]
    }

    let sortOptions = {}; 

    switch (sort) {
      case "new_communities":
        sortOptions = { createdAt: -1 }
        break;
      case "old_communities":
        sortOptions = { createdAt: 1 }
        break;
      default:
        sortOptions = { createdAt: -1 }
        break;
    }

    const communities = await Community.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(limit)
      .populate([
        {
          path: "createdBy",
          model: "User",
          select: "name username bio"
        }
      ]);

    const totalCommunities = await Community.countDocuments(query);
    const hasNextPage = totalCommunities > skipAmount + communities.length; 

    return res.json({
      success: true,
      communities,
      totalCommunities,
      nextPage: hasNextPage ? page + 1 : null,
      hasNextPage
    });
  } catch (error) {
    console.log(error);
  }
}

const getMembersByCommunity = async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(communityId);
  
  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  const { sort } = req.query;

  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skipAmount = (page - 1) * limit;

  try {
    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        error: 'Community not found.'
      });
    }

    if (community.communityType === "Private") {
      if (!community.members.includes(userId)) {
        return res.status(404).json({
          success: false,
          error: 'You do not belong to this community.'
        });
      }
    }

    const query = {};   
    query._id = { $in: community.members };

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

const getRequestsByCommunity = async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(communityId);
  
  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  const { sort } = req.query;

  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skipAmount = (page - 1) * limit;

  try {
    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        error: 'Community not found.'
      });
    }

    if (community.communityType === "Private") {
      if (!community.members.includes(userId)) {
        return res.status(404).json({
          success: false,
          error: 'You do not belong to this community.'
        });
      }
    }

    const query = {};   
    query._id = { $in: community.membersRequests };

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
      community
    });
  } catch (error) {
    console.log(error);
  }
}

const createCommunity = async (req, res) => {

  const userId = req.user._id;

  const { error, value } = communitySchema.validate(req.body);

  if (error) {
    console.log(error);
    
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
      community: result
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
      community: updatedCommunity
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

const joinCommunity = async (req, res) => {

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

    if (community.communityType === "Private") {  
      return res.status(404).json({
        success: false,
        error: 'Something wrong.'
      });
    }

    if (community.createdBy.toString() === userId) {  
      return res.status(404).json({
        success: false,
        error: 'You cannot join your own community.'
      });
    }

    if (community.members.includes(userId)) {
      return res.status(404).json({
        success: false,
        error: 'You have already joined this community.'
      });
    }

    // Update Community Members
    await Community.findByIdAndUpdate(
      communityId,
      {
        $push: {
          members: userId
        }
      }
    );

    // Update User Communities
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          communities: communityId
        }
      }
    );

    return res.json({
      success: true,
      communityId
    })
  } catch (error) {
    console.log(error);
  }
}

const leaveCommunity = async (req, res) => {

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

    if (community.createdBy.toString() === userId) {  
      return res.status(404).json({
        success: false,
        error: 'You cannot leave your own community.'
      });
    }

    if (!community.members.includes(userId)) {
      return res.status(404).json({
        success: false,
        error: 'You do not belong to this community.'
      });
    }

    // Update Community Members
    await Community.findByIdAndUpdate(
      communityId,
      {
        $pull: {
          members: userId
        }
      }
    );

    // Update User Communities
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          communities: communityId
        }
      }
    );

    return res.json({
      success: true,
      communityId
    })
  } catch (error) {
    console.log(error);
  }
}

const requestMembership = async (req, res) => {
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

    if (community.createdBy.toString() === userId) {  
      return res.status(404).json({
        success: false,
        error: 'You cannot request membership in your own community.'
      });
    }

    if (community.communityType === "Public") {
      return res.status(404).json({
        success: false,
        error: 'Something wrong.'
      });
    }

    if (community.members.includes(userId)) {
      return res.status(404).json({
        success: false,
        error: 'Something wrong.'
      });
    }

    if (community.membersRequests.includes(userId)) {
      return res.status(404).json({
        success: false,
        error: 'You have already sent a request.'
      });
    }

    // Update Community Request Members
    await Community.findByIdAndUpdate(
      communityId,
      {
        $push: {
          membersRequests: userId
        }
      }
    );

    return res.json({
      success: true,
      communityId
    })
  } catch (error) {
    console.log(error);
  }
}

const deleteRequestMembership = async (req, res) => {
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

    if (community.createdBy.toString() === userId) {  
      return res.status(404).json({
        success: false,
        error: 'You cannot delete request membership in your own community.'
      });
    }

    if (community.communityType === "Public") {
      return res.status(404).json({
        success: false,
        error: 'Something wrong.'
      });
    }

    if (community.members.includes(userId)) {
      return res.status(404).json({
        success: false,
        error: 'Something wrong.'
      });
    }

    if (!community.membersRequests.includes(userId)) {
      return res.status(404).json({
        success: false,
        error: 'You have not sent a request.'
      });
    }

    // Update Community Request Members
    await Community.findByIdAndUpdate(
      communityId,
      {
        $pull: {
          membersRequests: userId
        }
      }
    );

    return res.json({
      success: true,
      communityId
    })
  } catch (error) {
    console.log(error);
  }
}

const acceptMembership = async (req, res) => {
  const { communityId, requestingUserId } = req.params;
  const userId = req.user._id;

  try {
    
    const community = await Community.findById(communityId);

    if (!community) {  
      return res.status(404).json({
        success: false, 
        error: 'Community not found.'
      });
    }

    const requestingUser = await User.findById(requestingUserId);

    if (!requestingUser) {  
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    if (community.createdBy.toString() !== userId) {  
      return res.status(404).json({
        success: false, 
        error: 'Unauthorized.'
      });
    }

    if (!community.membersRequests.includes(requestingUserId)) {  
      return res.status(404).json({
        success: false, 
        error: 'Something wrong.'
      });
    }

    // Update Community Members and Members Requests
    await Community.findByIdAndUpdate(
      communityId,
      {
        $push: {
          members: requestingUserId
        },
        $pull: {
          membersRequests: requestingUserId
        }
      }
    );

    // Update User Communities
    await User.findByIdAndUpdate(
      requestingUserId,
      {
        $push: {
          communities: communityId
        }
      }
    );

    return res.json({
      success: true,
      communityId
    });   
  } catch (error) {
    console.log(error);
  }
}

const denyMembership = async (req, res) => {
  const { communityId, requestingUserId } = req.params;
  const userId = req.user._id;

  try {
    const community = await Community.findById(communityId);

    if (!community) {  
      return res.status(404).json({
        success: false, 
        error: 'Community not found.'
      });
    }

    const requestingUser = await User.findById(requestingUserId);

    if (!requestingUser) {  
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    if (community.createdBy.toString() !== userId) {  
      return res.status(404).json({
        success: false, 
        error: 'Unauthorized.'
      });
    }

    if (!community.membersRequests.includes(requestingUserId)) {  
      return res.status(404).json({
        success: false, 
        error: 'Something wrong.'
      });
    }

    // Update Community Members and Members Requests
    await Community.findByIdAndUpdate(
      communityId,
      {
        $pull: {
          membersRequests: requestingUserId
        }
      }
    );

    return res.json({
      success: true,
      communityId
    }); 
  } catch (error) {
    console.log(error);
  }
}

const deleteMember = async (req, res) => {
  const { communityId, memberId } = req.params;
  const userId = req.user._id;

  try {
    const community = await Community.findById(communityId);

    if (!community) {  
      return res.status(404).json({
        success: false, 
        error: 'Community not found.'
      });
    }

    const member = await User.findById(memberId);

    if (!member) {  
      return res.status(404).json({
        success: false,
        error: 'Member not found.'
      });
    }

    if (community.createdBy.toString() !== userId) {  
      return res.status(404).json({
        success: false, 
        error: 'Unauthorized.'
      });
    }

    if (!community.members.includes(memberId)) {  
      return res.status(404).json({
        success: false, 
        error: 'Something wrong.'
      });
    }

    // Update Community Members
    await Community.findByIdAndUpdate(
      communityId,
      {
        $pull: {
          members: memberId
        }
      }
    );

    // Update User Communities
    await User.findByIdAndUpdate(
      memberId,
      {
        $pull: {
          communities: communityId
        }
      }
    );

    return res.json({
      success: true,
      communityId
    })
  } catch (error) {
    console.log(error);
  }
}

export {
  getCommunities,
  getMembersByCommunity,
  getRequestsByCommunity,
  getCommunity,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  requestMembership,
  deleteRequestMembership,
  acceptMembership,
  denyMembership,
  deleteMember
}