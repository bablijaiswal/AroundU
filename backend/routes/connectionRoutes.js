import express from 'express';
import { createConnection, getConnections, updateConnection } from '../controllers/connectionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/connections', authMiddleware, getConnections);
router.post('/connections', authMiddleware, createConnection);
router.put('/connections/:id', authMiddleware, updateConnection);

export default router;
