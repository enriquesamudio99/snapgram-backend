import { Router } from 'express';
import { 
  getComments,
  getComment,
  createComment,
  createReplyToComment,
  deleteCommentAndReplies,
  deleteReply
} from '../controllers/comment.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/', getComments);
router.get('/:commentId', getComment);
router.post('/:postId', verifyToken, createComment);
router.post('/reply/:commentId', verifyToken, createReplyToComment);
router.delete('/:commentId', verifyToken, deleteCommentAndReplies);
router.delete('/reply/:commentId', verifyToken, deleteReply);

export default router;