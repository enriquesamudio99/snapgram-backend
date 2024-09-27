import { Router } from 'express';
import { 
  createPost,
  getPosts,
  getPostsByFollowing,
  getPostsByCommunity,
  getPostsByUser,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  getPost,
  sharePost,
  unsharePost,
} from '../controllers/post.controller.js';
import upload from '../config/multer.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/', getPosts);
router.get('/following', verifyToken, getPostsByFollowing);
router.get('/community/:communityId', verifyToken, getPostsByCommunity);
router.get('/user/:userId', verifyToken, getPostsByUser);
router.get('/:postId', getPost);
router.post('/', verifyToken, upload.array('images', 10), createPost);
router.post('/community/:communityId', verifyToken, upload.array('images', 10), createPost);
router.patch('/:postId', verifyToken, upload.array('images', 10), updatePost);
router.delete('/:postId', verifyToken, deletePost);
router.patch('/like/:postId', verifyToken, likePost);
router.patch('/unlike/:postId', verifyToken, unlikePost);
router.patch('/save/:postId', verifyToken, savePost);
router.patch('/unsave/:postId', verifyToken, unsavePost);
router.post('/share/:postId', verifyToken, sharePost);
router.post('/unshare/:postId', verifyToken, unsharePost);

export default router;