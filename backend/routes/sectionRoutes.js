import { Router } from 'express';
import { getConnections, getEvents, getHelpHubItems } from '../controllers/sectionController.js';

const router = Router();

router.get('/events', getEvents);
router.get('/connections', getConnections);
router.get('/help-hub', getHelpHubItems);

export default router;
