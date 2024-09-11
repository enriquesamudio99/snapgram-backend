import Post from '../models/post.js';
import Comment from '../models/comment.js';
import { commentSchema } from "../validations/comment.validation.js";
import { validateObjectId } from '../helpers/utilities.js';

const getComments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "firstName lastName username"
      });

    return res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.log(error);
  }
}

const getComment = async (req, res) => {
  const { commentId } = req.params;

  const isValidId = validateObjectId(commentId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {
    const comment = await Comment.findById(commentId);
    
    if (!comment) {  
      return res.status(404).json({
        success: false,
        error: 'Comment not found.'
      });
    }

    return res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.log(error);
  }
}

const createComment = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(postId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  const { error, value } = commentSchema.validate(req.body);

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  } 

  try {
    const post = Post.findById(postId);

    if (!post) {  
      return res.status(404).json({
        success: false,
        error: 'Post object id.'
      });
    }

    const comment = new Comment(value);
    comment.author = userId;

    const result = await comment.save();

    // Update Post
    await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: result._id
        }
      }
    );

    return res.json({
      success: true,
      message: "Comment created successfully"
    });
  } catch (error) {
    console.log(error);
  }
}

const createReplyToComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(commentId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  const { error, value } = commentSchema.validate(req.body);

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Something wrong.'
    });
  } 

  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {  
      return res.status(404).json({
        success: false,
        error: 'Comment not found.'
      });
    }

    const reply = new Comment(value);
    reply.author = userId;

    const result = await reply.save();

    // Update Post
    await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: {
          replies: result._id
        }
      }
    );

    return res.json({
      success: true,
      message: "Reply created successfully"
    });
  } catch (error) {
    console.log(error);
  }
}

const deleteCommentAndReplies = async (req, res) => {

  const { commentId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(commentId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {
    const comment = await Comment.findById(commentId);
    
    if (!comment) {  
      return res.status(404).json({
        success: false,
        error: 'Comment not found.'
      });
    }

    if (comment.author.toString() !== userId.toString()) {
      return res.status(404).json({
        success: false,
        error: 'Unauthorized.'
      });
    }

    // Delete Comment Replies
    await deleteReplies(comment.replies);

    // Delete Main Comment
    await Comment.findByIdAndDelete(commentId);

    // Update Post Comments
    await Post.findOneAndUpdate(
      { comments: commentId },
      { $pull: { comments: commentId } }
    );

    return res.json({
      success: true, 
      message: 'Comment and its replies deleted successfully'
    });
  } catch (error) {
    console.log(error);
  }
}

const deleteReply = async (req, res) => {

  const { commentId } = req.params;
  const userId = req.user._id;

  const isValidId = validateObjectId(commentId);

  if (!isValidId) {  
    return res.status(404).json({
      success: false,
      error: 'Invalid object id.'
    });
  }

  try {
    const comment = await Comment.findById(commentId);
    const isMainComment = await Post.findOne({ comments: commentId });
    
    if (!comment || isMainComment) {  
      return res.status(404).json({
        success: false,
        error: 'Comment not found.'
      });
    }

    if (comment.author.toString() !== userId.toString()) {
      return res.status(404).json({
        success: false,
        error: 'Unauthorized.'
      });
    }

    // Delete Replies of the Reply
    await deleteReplies(comment.replies);

    // Delete Reply Comment
    await Comment.findByIdAndDelete(commentId);

    // Update Paren Comment
    await Comment.findOneAndUpdate(
      { replies: commentId },
      { $pull: { replies: commentId } }
    );

    return res.json({
      success: true, 
      message: 'Reply deleted successfully'
    });
  } catch (error) {
    console.log(error);
  }
}

// Delete Replies Recursively
const deleteReplies = async (replies) => {
  for (const replyId of replies) {
    const reply = await Comment.findById(replyId);
    if (reply) {
      // Call the function recursively to remove answers from answers
      await deleteReplies(reply.replies);
      await Comment.findByIdAndDelete(replyId);
    }
  }
}

export {
  getComments,
  getComment,
  createComment,
  createReplyToComment,
  deleteCommentAndReplies,
  deleteReply,
  deleteReplies
}