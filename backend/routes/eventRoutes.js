import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import { getExternalEvents } from '../services/eventsService.js';

const router = Router();

router.get('/events', getEvents);
router.get('/events/external', async (req, res) => {
  try {
    const city = req.query.city || 'Delhi';
    const events = await getExternalEvents(city);

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external events',
    });
  }
});
router.get('/events/:id', getEventById);
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

export default router;
