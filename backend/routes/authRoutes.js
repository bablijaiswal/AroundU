import express from 'express';
import { login, logout, me, signup, syncFirebaseUser, updateProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/firebase-sync', authMiddleware, syncFirebaseUser);
router.get('/me', authMiddleware, me);
router.put('/profile', authMiddleware, updateProfile);

export default router;
