import { Router } from 'express';
import { 
  loginUser, 
  logoutUser, 
  refreshUserToken, 
  registerUser 
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', loginUser); 
router.post('/register', registerUser); 
router.get('/refresh', refreshUserToken); 
router.get('/logout', logoutUser); 

export default router;