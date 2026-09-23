import Post from '../models/postModel.js';
import Connection from '../models/connectionModel.js';
import User from '../models/userModel.js';

function normalizePostDisplay(post) {
  if (!post) return post;

  const rawCreator = post.creatorId || post.creator;
  if (post.creatorName) {
    post.creator = post.creatorName;
    return post;
  }

  if (rawCreator && /^[a-fA-F0-9]{24}$/.test(String(rawCreator))) {
    return User.findById(rawCreator).then((user) => {
      if (user) {
        post.creatorName = user.name;
        post.creator = user.name;
      }
      return post;
    });
  }

  return Promise.resolve(post);
}

// GET /api/posts
export async function getPosts(req, res, next) {
  try {
    const { keyword, category, location, date } = req.query;
    const filter = {};
    if (keyword) filter.$or = [{ title: { $regex: keyword, $options: 'i' } }, { description: { $regex: keyword, $options: 'i' } }];
    if (category && category !== 'All') filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0,0,0,0));
      const end = new Date(d.setHours(23,59,59,999));
      filter.date = { $gte: start, $lte: end };
    }

    const posts = await Post.find(filter).sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(posts.map((post) => normalizePostDisplay(post)));
    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/:id
export async function getPostById(req, res, next) {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const normalized = await normalizePostDisplay(post);
    const interested = await Connection.find({ relatedPost: normalized._id, status: 'accepted' }).lean();
    res.json({ success: true, data: { ...normalized, interested } });
  } catch (err) { next(err); }
}

// POST /api/posts
export async function createPost(req, res, next) {
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
    delete payload.creatorIdOverride;
    const created = await Post.create(payload);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
}

// PUT /api/posts/:id
export async function updatePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (!req.user || req.user.id !== post.creatorId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    Object.assign(post, req.body);
    if (req.user.name) {
      post.creator = req.user.name;
      post.creatorName = req.user.name;
    }
    const updated = await post.save();
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

// DELETE /api/posts/:id
export async function deletePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (!req.user || req.user.id !== post.creatorId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await post.deleteOne();
    await Connection.deleteMany({ relatedPost: post._id });
    res.json({ success: true });
  } catch (err) { next(err); }
}
