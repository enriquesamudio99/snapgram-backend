import { Router } from 'express';
import { 
  getUsers,
  getUser,
  followUser,
  unfollowUser
} from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get("/", verifyToken, getUsers);
router.get("/:id", verifyToken, getUser);
router.patch("/follow/:id", verifyToken, followUser);
router.patch("/unfollow/:id", verifyToken, unfollowUser);

export default router;