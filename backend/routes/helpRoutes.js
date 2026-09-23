import express from 'express';
import { getHelpRequests, getHelpById, createHelp, updateHelp, deleteHelp, respondToHelp } from '../controllers/helpController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getHelpRequests);
router.post('/', authMiddleware, createHelp);
router.get('/:id', getHelpById);
router.put('/:id', authMiddleware, updateHelp);
router.delete('/:id', authMiddleware, deleteHelp);
router.post('/:id/respond', authMiddleware, respondToHelp);

export default router;
