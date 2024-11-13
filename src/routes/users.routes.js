import { Router } from 'express';
import { 
  getUsers,
  getUser,
  getCurrentUser,
  followUser,
  unfollowUser,
  getUsersByCreatedPosts
} from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get("/", verifyToken, getUsers);
router.get("/created-posts", verifyToken, getUsersByCreatedPosts);
router.get("/current", verifyToken, getCurrentUser);
router.get("/:userId", verifyToken, getUser);
router.patch("/follow/:followUserId", verifyToken, followUser);
router.patch("/unfollow/:unfollowUserId", verifyToken, unfollowUser);

export default router;