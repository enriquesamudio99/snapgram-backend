import { Router } from 'express';
import { 
  createPost,
  getPosts,
  getPostsByFollowing,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  getPost,
  sharePost,
  unsharePost
} from '../controllers/post.controller.js';
import upload from '../config/multer.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/', getPosts);
router.get('/following', verifyToken, getPostsByFollowing);
router.get('/:id', getPost);
router.post('/', verifyToken, upload.array('images', 10), createPost);
router.patch('/:id', verifyToken, upload.array('images', 10), updatePost);
router.delete('/:id', verifyToken, deletePost);
router.patch('/like/:id', verifyToken, likePost);
router.patch('/unlike/:id', verifyToken, unlikePost);
router.patch('/save/:id', verifyToken, savePost);
router.patch('/unsave/:id', verifyToken, unsavePost);
router.post('/share/:id', verifyToken, sharePost);
router.post('/unshare/:id', verifyToken, unsharePost);

export default router;