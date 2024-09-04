import User from '../models/user.js';
import Post from '../models/post.js';
import uploadImages from "../helpers/uploadImages.js";
import { postSchema } from "../validations/post.validation.js";
import { validateObjectId } from '../helpers/utilities.js';
import deleteImages from '../helpers/deleteImages.js';

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'author',
        select: 'firstName lastName username'
      });

    return res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.log(error);
  }
}

const getPostsByFollowing = async (req, res) => {

  const userId = req.user._id;

  try {
    const user = await User.findById(userId);

    if (!user) {  
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    const posts = await Post.find({ author: { $in: user.following } })
      .sort({ createdAt: -1 })
      .populate({
        path: 'author',
        select: 'firstName lastName username'
      });

    return res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.log(error);
  }
}

const getPost = async (req, res) => {

  const { id } = req.params;

  const isValidId = validateObjectId(id);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {
    const post = await Post.findById(id)
      .populate({
        path: 'author',
        select: 'firstName lastName username'
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

  const userId = req.user._id;

  if(req.files.length === 0) {
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

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.log(error);
  }
}

const updatePost = async (req, res) => {

  const { id } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(id);

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
    const post = await Post.findById(id);

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
      id,
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

  const { id } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(id);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {

    const post = await Post.findById(id);

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

    // Update user
    await User.findByIdAndUpdate(
      userId, 
      {
        $pull: { 
          posts: post._id 
        },
      } 
    );

    const imagesToRemove = post.images.map((image) => image.public_id);
    await deleteImages(imagesToRemove);
    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully.'
    });
    
  } catch (error) {
    console.log(error);
  }
}

const likePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(id);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try { 
    const post = await Post.findById(id);

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
    })
  } catch (error) {
    console.log(error);
  }
}

const unlikePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(id);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try { 
    const post = await Post.findById(id);

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
    })
  } catch (error) {
    console.log(error);
  }
}

const savePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(id);

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

    if (user.savedPosts.includes(id)) {
      return res.status(404).json({
        success: false,
        error: 'You already save this post.'
      });
    }

    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          savedPosts: id
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
  const { id } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(id);

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

    if (!user.savedPosts.includes(id)) {
      return res.status(404).json({
        success: false,
        error: 'You have not saved this post.'
      });
    }

    await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          savedPosts: id
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

export {
  getPosts,
  getPostsByFollowing,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  savePost,
  unsavePost
}