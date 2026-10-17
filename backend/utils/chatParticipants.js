import User from '../models/userModel.js';

const MONGO_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

export function isMongoId(value) {
  return MONGO_ID_PATTERN.test(String(value || ''));
}

export async function resolveToUserId(idOrUidOrEmail) {
  if (!idOrUidOrEmail) return null;
  const str = String(idOrUidOrEmail).trim();
  if (isMongoId(str)) {
    const user = await User.findById(str).select('_id').lean();
    if (user) return user._id.toString();
  }

  const user = await User.findOne({
    $or: [
      { firebaseUid: str },
      { email: str.toLowerCase() },
      { name: str },
    ],
  }).select('_id').lean();

  if (user) return user._id.toString();
  return str;
}

export async function resolveUserName(idOrUidOrEmail) {
  if (!idOrUidOrEmail) return '';
  const str = String(idOrUidOrEmail).trim();

  if (isMongoId(str)) {
    const user = await User.findById(str).select('name').lean();
    if (user?.name) return user.name;
  }

  const user = await User.findOne({
    $or: [
      { firebaseUid: str },
      { email: str.toLowerCase() },
    ],
  }).select('name').lean();

  if (user?.name) return user.name;
  return str;
}

export async function resolveParticipantSummary(participants = [], currentUserId, currentUserUid = null) {
  const participantIds = Array.isArray(participants)
    ? participants.map((p) => String(p || '').trim()).filter(Boolean)
    : [];

  const currentUserExclude = [String(currentUserId || ''), String(currentUserUid || '')].filter(Boolean);
  const otherParticipantId =
    participantIds.find((p) => !currentUserExclude.includes(p)) || participantIds[0] || '';

  if (!otherParticipantId) {
    return {
      otherParticipantId: '',
      otherParticipantName: 'Contact',
      otherParticipantAvatar: '',
    };
  }

  let user = null;
  if (isMongoId(otherParticipantId)) {
    user = await User.findById(otherParticipantId).select('name profileImage').lean();
  }

  if (!user) {
    user = await User.findOne({
      $or: [
        { firebaseUid: otherParticipantId },
        { email: otherParticipantId.toLowerCase() },
        { name: otherParticipantId },
      ],
    }).select('name profileImage').lean();
  }

  return {
    otherParticipantId: user?._id?.toString() || otherParticipantId,
    otherParticipantName: user?.name || otherParticipantId,
    otherParticipantAvatar: user?.profileImage || '',
  };
}

export function normalizeParticipantIds(participants = []) {
  return Array.isArray(participants)
    ? participants.map((participant) => String(participant || '').trim()).filter(Boolean).sort()
    : [];
}