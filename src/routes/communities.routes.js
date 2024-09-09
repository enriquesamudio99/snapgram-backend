import { Router } from 'express';
import { 
  getCommunities,
  getCommunity,
  createCommunity,
  updateCommunity,
  deleteCommunity
} from '../controllers/community.controller.js';
import upload from '../config/multer.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/', getCommunities);
router.get('/:id', getCommunity);
router.post('/', verifyToken, upload.array('images', 1), createCommunity);
router.patch('/:id', verifyToken, upload.array('images', 1), updateCommunity);
router.delete('/:id', verifyToken, deleteCommunity);

export default router;