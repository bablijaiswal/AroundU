import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import { signToken } from '../utils/jwt.js';

function safeUser(user) {
  return {
    id: user._id.toString(),
    firebaseUid: user.firebaseUid || null,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage || '',
    bio: user.bio || '',
    city: user.city || '',
    interests: user.interests || [],
    role: user.role || 'user',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function signup(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This email is already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      profileImage: '',
      bio: '',
      city: '',
      interests: [],
      role: 'user',
    });

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      user: safeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: safeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
}

export async function me(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function syncFirebaseUser(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let user = await User.findOne({ firebaseUid: req.user.firebaseUid }).select('-passwordHash');
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email.toLowerCase() }).select('-passwordHash');
    }

    if (!user) {
      user = await User.create({
        firebaseUid: req.user.firebaseUid,
        name: req.user.name || req.user.email?.split('@')[0] || 'AroundU User',
        email: req.user.email,
        profileImage: req.user.profileImage || '',
        bio: '',
        city: '',
        interests: [],
        role: 'user',
      });
    } else {
      user.name = user.name || req.user.name || req.user.email?.split('@')[0] || 'AroundU User';
      user.profileImage = user.profileImage || req.user.profileImage || '';
      user.email = user.email || req.user.email;
      user.firebaseUid = user.firebaseUid || req.user.firebaseUid;
      await user.save();
    }

    res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : user.name;
    const bio = typeof req.body?.bio === 'string' ? req.body.bio.trim() : user.bio || '';
    const city = typeof req.body?.city === 'string' ? req.body.city.trim() : user.city || '';

    const rawInterests = req.body?.interests;
    const interests = Array.isArray(rawInterests)
      ? rawInterests.map((item) => String(item).trim()).filter(Boolean)
      : typeof rawInterests === 'string'
        ? rawInterests.split(',').map((item) => item.trim()).filter(Boolean)
        : user.interests || [];

    if (name) user.name = name;
    user.bio = bio;
    user.city = city;
    user.interests = interests;

    await user.save();

    res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}
