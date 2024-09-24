import User from '../models/user.js';
import Post from '../models/post.js';
import Community from '../models/community.js';
import Comment from '../models/comment.js';
import { postSchema } from "../validations/post.validation.js";
import { validateObjectId } from '../helpers/utilities.js';
import { uploadImages, deleteImages } from '../helpers/images.js';
import { deleteReplies } from './comment.controller.js';

const getPosts = async (req, res) => {
  const { searchQuery, sort } = req.query;

  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skipAmount = (page - 1) * limit;

  try {
    const query = {};   
    query.community = [null, undefined];
    
    if(searchQuery) {
      const escapedSearchQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { caption: { $regex: new RegExp(escapedSearchQuery, 'i') }}
      ]
    }

    let sortOptions = {}; 

    switch (sort) {
      case "new_posts":
        sortOptions = { createdAt: -1 }
        break;
      case "old_posts":
        sortOptions = { createdAt: 1 }
        break;
      default:
        sortOptions = { createdAt: -1 }
        break;
    }

    const posts = await Post.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(limit)
      .populate({
        path: 'author',
        select: 'name username'
      })
      .populate({
        path: 'originalPost',
        populate: {
          path: 'author',
          select: 'name username'
        }
      });
    
    const totalPosts = await Post.countDocuments(query);
    const isNext = totalPosts > skipAmount + posts.length; 

    return res.json({
      success: true,
      data: posts,
      totalPosts,
      isNext
    });
  } catch (error) {
    console.log(error);
  }
}

const getPostsByFollowing = async (req, res) => {

  const userId = req.user._id;
  const { searchQuery, sort } = req.query;

  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skipAmount = (page - 1) * limit;

  try {
    const user = await User.findById(userId);

    if (!user) {  
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    const query = {};   
    query.community = [null, undefined];
    query.author = { $in: user.following }
    
    if(searchQuery) {
      const escapedSearchQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { caption: { $regex: new RegExp(escapedSearchQuery, 'i') }}
      ]
    }

    let sortOptions = {}; 

    switch (sort) {
      case "new_posts":
        sortOptions = { createdAt: -1 }
        break;
      case "old_posts":
        sortOptions = { createdAt: 1 }
        break;
      default:
        sortOptions = { createdAt: -1 }
        break;
    }
 
    const posts = await Post.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(limit)
      .populate({
        path: 'author',
        select: 'name username'
      })
      .populate({
        path: 'originalPost',
        populate: {
          path: 'author',
          select: 'name username'
        }
      });
    
    const totalPosts = await Post.countDocuments(query);
    const isNext = totalPosts > skipAmount + posts.length; 

    return res.json({
      success: true,
      data: posts,
      totalPosts,
      isNext
    });
  } catch (error) {
    console.log(error);
  }
}


const getPostsByCommunity = async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(communityId);
  
  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  const { searchQuery, sort } = req.query;

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
    query.community = communityId;
    
    if(searchQuery) {
      const escapedSearchQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { caption: { $regex: new RegExp(escapedSearchQuery, 'i') }}
      ]
    }

    let sortOptions = {}; 

    switch (sort) {
      case "new_posts":
        sortOptions = { createdAt: -1 }
        break;
      case "old_posts":
        sortOptions = { createdAt: 1 }
        break;
      default:
        sortOptions = { createdAt: -1 }
        break;
    }

    const posts = await Post.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(limit)
      .populate({
        path: 'author',
        select: 'name username'
      })
      .populate({
        path: 'originalPost',
        populate: {
          path: 'author',
          select: 'name username'
        }
      });
    
    const totalPosts = await Post.countDocuments(query);
    const isNext = totalPosts > skipAmount + posts.length; 

    return res.json({
      success: true,
      data: posts,
      totalPosts,
      isNext
    });
  } catch (error) {
    console.log(error);
  }
}

const getPost = async (req, res) => {

  const { postId } = req.params;

  const isValidId = validateObjectId(postId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {
    const post = await Post.findById(postId)
      .populate({
        path: 'author',
        select: 'name username'
      });

    if (!post) {  
      return res.status(404).json({
        success: false,
        error: 'Post not found.'
      });
    }

    return res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.log(error);
  }
}

const createPost = async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  if(req.files && req.files.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'You must upload at least one image.'
    });
  }
  
  const { error, value } = postSchema.validate(req.body);

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  }

  try {

    // Upload images
    const images = await uploadImages(req.files);

    // Create Post
    const post = new Post(value);
    post.author = userId;
    post.images = images;
    post.tags = value.tags ? value.tags.split(",").map(tag => tag.trim()) : [];
    post.community = communityId ? communityId : null;

    const result = await post.save();

    // Update user
    await User.findByIdAndUpdate(
      userId, 
      {
        $push: { 
          posts: result._id 
        },
      } 
    );

    // Update Community
    if (communityId) {
      await Community.findByIdAndUpdate(
        communityId, 
        {
          $push: { 
            posts: result._id 
          },
        } 
      );
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.log(error);
  }
}

const updatePost = async (req, res) => {

  const { postId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(postId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  const { error, value } = postSchema.validate(req.body);

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  } 

  try {
    const post = await Post.findById(postId);

    if (!post) {  
      return res.status(404).json({
        success: false,
        error: 'Post not found.'
      });
    }

    if (post.author.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Unauthorized.' 
      });
    } 

    // Delete images if there are to delete
    if (value.imagesToRemove && value.imagesToRemove.length > 0) {
      post.images = post.images.filter((image) => !value.imagesToRemove.includes(image.public_id));
      await deleteImages(value.imagesToRemove);
    }

    // Upload new images if necessary
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = await uploadImages(req.files);
    }

    post.images = [...post.images, ...newImages];

    if (post.images.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'You need at least one image.' 
      });
    } 

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        ...value,
        images: post.images
      },
      {
        new: true
      }
    );

    return res.json({
      success: true,
      data: updatedPost
    });
  } catch (error) {
    console.log(error);
  }
}

const deletePost = async (req, res) => {

  const { postId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(postId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {

    const post = await Post.findById(postId)
      .populate({
        path: "comments"
      });

    if (!post) {  
      return res.status(404).json({
        success: false,
        error: 'Post not found.'
      });
    }

    if (post.author.toString() !== userId) {  
      return res.status(404).json({
        success: false,
        error: 'Unauthorized.'
      });
    }

    // Delete All Comments and their Replies
    for (const comment of post.comments) {
      await deleteReplies(comment.replies);
      await Comment.findByIdAndDelete(comment._id);
    }

    // Update user
    await User.findByIdAndUpdate(
      userId, 
      {
        $pull: { 
          posts: post._id 
        },
      } 
    );

    // Delete Shared Posts
    await Post.deleteMany({ originalPost: post._id });

    // Update Users Saved Posts
    await User.updateMany({ $pull: { savedPosts: post._id } });

    // Update Community Posts
    if (post.community) {
      await Community.findByIdAndUpdate(
        post.community, 
        {
          $pull: { 
            posts: post._id 
          },
        } 
      );
    }

    const imagesToRemove = post.images.map((image) => image.public_id);
    await deleteImages(imagesToRemove);
    await post.deleteOne();

    return res.json({
      success: true,
      message: 'Post deleted successfully.'
    });
    
  } catch (error) {
    console.log(error);
  }
}

const likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(postId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try { 
    const post = await Post.findById(postId);

    if (!post) {  
      return res.status(404).json({
        success: false,
        error: 'Post not found.'
      });
    }

    if (post.likes.includes(userId)) {
      return res.status(404).json({
        success: false,
        error: 'You already like this post.'
      });
    }

    await Post.findByIdAndUpdate(
      post._id,
      {
        $push: {
          likes: userId
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

const unlikePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(postId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try { 
    const post = await Post.findById(postId);

    if (!post) {  
      return res.status(404).json({
        success: false,
        error: 'Post not found.'
      });
    }

    if (!post.likes.includes(userId)) {
      return res.status(404).json({
        success: false,
        error: 'You have not liked this post.'
      });
    }

    await Post.findByIdAndUpdate(
      post._id,
      {
        $pull: {
          likes: userId
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

const savePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(postId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
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

    if (user.savedPosts.includes(postId)) {
      return res.status(404).json({
        success: false,
        error: 'You already save this post.'
      });
    }

    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          savedPosts: postId
        }
      }
    );

    return res.json({
      success: true
    })
  } catch (error) {
    console.log(error);
  }
}

const unsavePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(postId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
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

    if (!user.savedPosts.includes(postId)) {
      return res.status(404).json({
        success: false,
        error: 'You have not saved this post.'
      });
    }

    await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          savedPosts: postId
        }
      }
    );

    return res.json({
      success: true
    })
  } catch (error) {
    console.log(error);
  }
}

const sharePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(postId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {
    const originalPost = await Post.findById(postId);

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    if (userId.toString() === originalPost.author.toString()) {
      return res.status(404).json({
        success: false,
        error: 'You cannot share your own publication'
      });
    }

    const alreadyShared = originalPost.sharedBy.some((share) => share.user.toString() === userId.toString());

    if (alreadyShared) {
      return res.status(404).json({
        success: false,
        error: 'You have already shared this post'
      });
    }

    const post = new Post();
    post.author = userId;
    post.originalPost = originalPost._id;

    const result = await post.save();

    // Update Original Post
    await Post.findByIdAndUpdate(
      originalPost._id,
      {
        $push: {
          sharedBy: {
            user: userId
          }
        }
      }
    );

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.log(error);
  }
}

const unsharePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(postId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {
    const post = await Post.findById(postId);

    if (!post || !post.originalPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found or is not shared post'
      });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(404).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Delete Post
    await post.deleteOne();

    // Update Original Post
    await Post.findByIdAndUpdate(
      post.originalPost,
      {
        $pull: {
          sharedBy: {
            user: userId
          }
        }
      }
    );

    return res.status(201).json({
      success: true
    });
  } catch (error) {
    console.log(error);
  }
}

// Delete Posts And Images
const deletePostsAndImages = async (posts) => {
  for (const postId of posts) {
    const post = await Post.findById(postId);
    if (post) {
      const imagesToRemove = post.images.map((image) => image.public_id);
      await deleteImages(imagesToRemove);
      await post.deleteOne();
    }
  }
}

export {
  getPosts,
  getPostsByFollowing,
  getPostsByCommunity,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  sharePost,
  unsharePost,
  deletePostsAndImages
}