import { Router } from 'express';
import { 
  getCommunities,
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
} from '../controllers/community.controller.js';
import upload from '../config/multer.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/', getCommunities);
router.get('/:communityId', getCommunity);
router.post('/', verifyToken, upload.array('images', 1), createCommunity);
router.patch('/:communityId', verifyToken, upload.array('images', 1), updateCommunity);
router.delete('/:communityId', verifyToken, deleteCommunity);
router.patch('/join/:communityId', verifyToken, joinCommunity);
router.patch('/leave/:communityId', verifyToken, leaveCommunity);
router.patch('/request/:communityId', verifyToken, requestMembership);
router.patch('/delete-request/:communityId', verifyToken, deleteRequestMembership);
router.patch('/accept-membership/:communityId/:requestingUserId', verifyToken, acceptMembership);
router.patch('/deny-membership/:communityId/:requestingUserId', verifyToken, denyMembership);
router.patch('/delete-member/:communityId/:memberId', verifyToken, deleteMember);

export default router;