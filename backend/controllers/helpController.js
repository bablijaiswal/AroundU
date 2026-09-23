import HelpRequest from '../models/helpRequestModel.js';
import User from '../models/userModel.js';

function normalizeHelpDisplay(item) {
  if (!item) return item;

  const rawCreator = item.creatorId || item.creator;
  if (item.creatorName) {
    item.creator = item.creatorName;
    return item;
  }

  if (rawCreator && /^[a-fA-F0-9]{24}$/.test(String(rawCreator))) {
    return User.findById(rawCreator).then((user) => {
      if (user) {
        item.creatorName = user.name;
        item.creator = user.name;
      }
      return item;
    });
  }

  return Promise.resolve(item);
}

// GET /api/help
export async function getHelpRequests(req, res, next) {
  try {
    const { type, category, location, date } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0,0,0,0));
      const end = new Date(d.setHours(23,59,59,999));
      filter.date = { $gte: start, $lte: end };
    }
    const list = await HelpRequest.find(filter).sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(list.map((item) => normalizeHelpDisplay(item)));
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
}

// GET /api/help/:id
export async function getHelpById(req, res, next) {
  try {
    const help = await HelpRequest.findById(req.params.id).lean();
    if (!help) return res.status(404).json({ success: false, message: 'Not found' });
    const normalized = await normalizeHelpDisplay(help);
    res.json({ success: true, data: normalized });
  } catch (err) { next(err); }
}

// POST /api/help
export async function createHelp(req, res, next) {
  try {
    const userId = req.user?.id || req.body.creatorId;
    const creatorName = req.user?.name || req.body.creatorName || 'Community Member';
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const payload = {
      ...req.body,
      creator: creatorName,
      creatorId: userId,
      creatorName,
    };

    delete payload._id;
    const created = await HelpRequest.create(payload);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
}

// PUT /api/help/:id
export async function updateHelp(req, res, next) {
  try {
    const help = await HelpRequest.findById(req.params.id);
    if (!help) return res.status(404).json({ success: false, message: 'Not found' });

    if (!req.user || req.user.id !== help.creatorId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    Object.assign(help, req.body);
    if (req.user.name) {
      help.creator = req.user.name;
      help.creatorName = req.user.name;
    }
    const updated = await help.save();
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

// DELETE /api/help/:id
export async function deleteHelp(req, res, next) {
  try {
    const help = await HelpRequest.findById(req.params.id);
    if (!help) return res.status(404).json({ success: false, message: 'Not found' });

    if (!req.user || req.user.id !== help.creatorId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await help.deleteOne();
    res.json({ success: true });
  } catch (err) { next(err); }
}

// POST /api/help/:id/respond
export async function respondToHelp(req, res, next) {
  try {
    const help = await HelpRequest.findById(req.params.id);
    if (!help) return res.status(404).json({ success: false, message: 'Not found' });
    const { responder } = req.body;
    if (!responder) return res.status(400).json({ success: false, message: 'responder required' });
    // avoid duplicates
    if (!help.responders.includes(responder)) help.responders.push(responder);
    // optionally move status to in_progress when someone responds to need_help
    if (help.type === 'need_help') help.status = 'in_progress';
    await help.save();
    res.json({ success: true, data: help });
  } catch (err) { next(err); }
}
