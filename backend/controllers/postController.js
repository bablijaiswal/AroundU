import Post from '../models/postModel.js';
import Connection from '../models/connectionModel.js';
import User from '../models/userModel.js';

async function normalizePostDisplay(post) {
  if (!post) return post;

  const rawCreator = post.creatorId || post.creator;
  let user = null;

  if (rawCreator && /^[a-fA-F0-9]{24}$/.test(String(rawCreator))) {
    user = await User.findById(rawCreator).select('name profileImage').lean();
  }

  if (!user && rawCreator) {
    user = await User.findOne({
      $or: [
        { firebaseUid: String(rawCreator) },
        { name: String(rawCreator) },
        { email: String(rawCreator).toLowerCase() },
      ],
    }).select('name profileImage').lean();
  }

  if (user) {
    post.creatorId = post.creatorId || user._id.toString();
    post.creatorName = user.name || post.creatorName || user.email?.split('@')[0];
    post.creator = post.creatorName;
    post.creatorAvatar = user.profileImage || post.creatorAvatar || '';
  } else {
    post.creatorName = post.creatorName || post.creator || 'Community Member';
    post.creator = post.creatorName;
    post.creatorAvatar = post.creatorAvatar || '';
  }

  return post;
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
    const creatorAvatar = req.user?.profileImage || '';
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const payload = {
      ...req.body,
      creator: creatorName,
      creatorId: userId,
      creatorName,
      creatorAvatar,
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
