import { Router } from 'express';
import { 
  createResetPasswordToken,
  deleteUser,
  loginUser, 
  refreshUserToken, 
  registerUser, 
  resetUserPassword, 
  updateUser,
  updateUserPassword
} from '../controllers/auth.controller.js';
import { verifyToken, verifyTokenAndUser } from '../middlewares/auth.js';

const router = Router();

router.post('/login', loginUser); 
router.post('/register', registerUser); 
router.get('/refresh', verifyToken, refreshUserToken); 
router.post('/update/:userId', verifyTokenAndUser, updateUser); 
router.post('/update-password/:userId', verifyTokenAndUser, updateUserPassword); 
router.delete('/delete/:userId', verifyTokenAndUser, deleteUser); 
router.post('/forget-password', createResetPasswordToken);
router.patch('/forget-password/:token', resetUserPassword);

export default router;