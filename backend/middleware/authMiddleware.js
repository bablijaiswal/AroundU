import User from '../models/userModel.js';
import { verifyFirebaseToken } from '../config/firebaseAdmin.js';

export async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : req.headers['x-firebase-token'] || '';

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const decoded = await verifyFirebaseToken(token);
    const firebaseUid = decoded.uid;
    const email = String(decoded.email || '').trim().toLowerCase();

    if (!firebaseUid) {
      return res.status(401).json({ success: false, message: 'Invalid Firebase token.' });
    }

    let user = await User.findOne({ firebaseUid }).select('-passwordHash');

    if (!user && email) {
      user = await User.findOne({ email }).select('-passwordHash');
    }

    if (!user) {
      user = await User.create({
        firebaseUid,
        name: decoded.name || decoded.email?.split('@')[0] || 'AroundU User',
        email: email || `${firebaseUid}@firebase.local`,
        profileImage: decoded.picture || '',
        bio: '',
        city: '',
        interests: [],
        role: 'user',
      });
    } else {
      const shouldUpdate =
        (!user.name && decoded.name) ||
        (!user.profileImage && decoded.picture) ||
        (user.email !== email) ||
        (!user.firebaseUid && firebaseUid);

      if (shouldUpdate) {
        user.name = user.name || decoded.name || decoded.email?.split('@')[0] || 'AroundU User';
        user.profileImage = user.profileImage || decoded.picture || '';
        user.email = email || user.email;
        user.firebaseUid = user.firebaseUid || firebaseUid;
        await user.save();
      }
    }

    req.user = {
      id: user._id.toString(),
      firebaseUid: user.firebaseUid || firebaseUid,
      uid: user.firebaseUid || firebaseUid,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || '',
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired Firebase token.' });
  }
}
