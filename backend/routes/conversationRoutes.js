import express from 'express';
import {
  createOrGetConversation,
  getConversationById,
  getConversationContext,
  getConversations,
} from '../controllers/conversationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/conversations', authMiddleware, getConversations);
router.post('/conversations', authMiddleware, createOrGetConversation);
router.get('/conversations/:id', authMiddleware, getConversationById);
router.get('/conversations/:id/context', authMiddleware, getConversationContext);

export default router;
