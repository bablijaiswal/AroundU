import express from 'express';
import { createMessage, getConversation, getMessages } from '../controllers/messageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/messages', authMiddleware, getMessages);
router.get('/messages/conversation', authMiddleware, getConversation);
router.post('/messages', authMiddleware, createMessage);

export default router;
