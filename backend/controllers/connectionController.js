import Connection from '../models/connectionModel.js';
import Post from '../models/postModel.js';

// POST /api/connections
export async function createConnection(req, res, next) {
  try {
    const requester = req.user?.id || req.body.requester;
    const { receiver, relatedPost } = req.body;
    if (!requester || !receiver) return res.status(400).json({ success: false, message: 'requester and receiver required' });
    const exists = await Connection.findOne({ requester, receiver, relatedPost, status: 'pending' });
    if (exists) return res.status(409).json({ success: false, message: 'Request already pending' });
    const conn = await Connection.create({ requester, receiver, relatedPost });
    res.status(201).json({ success: true, data: conn });
  } catch (err) { next(err); }
}

// GET /api/connections
export async function getConnections(req, res, next) {
  try {
    const { user } = req.query;
    const filter = {};
    if (user) filter.$or = [{ requester: user }, { receiver: user }];
    const list = await Connection.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (err) { next(err); }
}

// PUT /api/connections/:id
export async function updateConnection(req, res, next) {
  try {
    const conn = await Connection.findById(req.params.id);
    if (!conn) return res.status(404).json({ success: false, message: 'Connection not found' });
    const { status } = req.body;
    if (status && ['pending','accepted','rejected','cancelled'].includes(status)) {
      conn.status = status;
      await conn.save();
      // if accepted, increment post.currentInterestedCount
      if (status === 'accepted' && conn.relatedPost) {
        await Post.findByIdAndUpdate(conn.relatedPost, { $inc: { currentInterestedCount: 1 } });
      }
      return res.json({ success: true, data: conn });
    }
    res.status(400).json({ success: false, message: 'invalid status' });
  } catch (err) { next(err); }
}
