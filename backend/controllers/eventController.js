import mongoose from 'mongoose';
import Event from '../models/eventModel.js';
import { eventSeed } from '../utils/mockData.js';

function fallbackEvents(query = {}) {
  const { keyword, category, city, date, price } = query;

  return eventSeed.filter((event) => {
    const title = (event.title || '').toLowerCase();
    const neighborhood = (event.neighborhood || '').toLowerCase();
    const text = `${title} ${neighborhood}`.trim();

    if (keyword && !text.includes(String(keyword).toLowerCase())) return false;
    if (category && category !== 'All' && event.category && event.category !== category) return false;
    if (city && event.city && !event.city.toLowerCase().includes(String(city).toLowerCase())) return false;
    if (date && event.date && new Date(event.date).toDateString() !== new Date(date).toDateString()) return false;
    if (price === 'free' && event.priceInformation && !/free/i.test(event.priceInformation)) return false;
    if (price === 'paid' && event.priceInformation && /free/i.test(event.priceInformation)) return false;

    return true;
  });
}

function fallbackEventById(id) {
  if (!id) return null;
  const candidates = eventSeed.map((event, index) => ({ ...event, _id: `seed-${index}` }));
  return candidates.find((event) => event._id === id || event.title?.toLowerCase() === String(id).toLowerCase()) || candidates[0];
}

// GET /api/events - list with filters
export async function getEvents(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: fallbackEvents(req.query) });
    }

    const { keyword, category, city, date, price } = req.query;
    const filter = {};

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { venue: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') filter.category = category;
    if (city) filter.city = { $regex: `^${city}$`, $options: 'i' };
    if (date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }

    if (price) {
      if (price === 'free') filter.priceInformation = { $regex: 'free', $options: 'i' };
      else if (price === 'paid') filter.priceInformation = { $not: { $regex: /free/i } };
    }

    const events = await Event.find(filter).sort({ date: 1 }).lean();
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
}

// GET /api/events/:id
export async function getEventById(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      const fallback = fallbackEventById(req.params.id);
      if (!fallback) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      return res.json({ success: true, data: fallback });
    }

    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) {
    if (err?.name === 'CastError') {
      const fallback = fallbackEventById(req.params.id);
      if (fallback) {
        return res.json({ success: true, data: fallback });
      }
    }
    next(err);
  }
}

// POST /api/events
export async function createEvent(req, res, next) {
  try {
    const payload = req.body;
    const created = await Event.create(payload);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

// PUT /api/events/:id
export async function updateEvent(req, res, next) {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/events/:id
export async function deleteEvent(req, res, next) {
  try {
    const removed = await Event.findByIdAndDelete(req.params.id).lean();
    if (!removed) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: removed });
  } catch (err) {
    next(err);
  }
}
