import express from 'express';
import { 
    registerUser, 
    loginUser, 
    googleLogin, 
    forgotPassword, 
    resetPassword,
    deleteUser 
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);
router.delete('/delete', protect, deleteUser);

export default router;