import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';
import Post from '../models/postModel.js';
import HelpRequest from '../models/helpRequestModel.js';
import {
  isMongoId,
  normalizeParticipantIds,
  resolveParticipantSummary,
  resolveToUserId,
  resolveUserName,
} from '../utils/chatParticipants.js';

export async function getConversations(req, res, next) {
  try {
    const user = req.user?.id || req.query.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const userIds = [req.user?.id, req.user?.firebaseUid, req.query.user].filter(Boolean).map(String);

    const conversations = await Conversation.find({ participants: { $in: userIds } })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const result = await Promise.all(
      conversations.map(async (conversation) => {
        const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
        const participant = await resolveParticipantSummary(conversation.participants, req.user?.id || user, req.user?.firebaseUid);
        const last = messages[messages.length - 1];

        const enrichedMessages = await Promise.all(
          messages.map(async (msg) => ({
            ...msg,
            id: msg._id.toString(),
            senderName: msg.senderName || (await resolveUserName(msg.senderId || msg.sender)),
            receiverName: msg.receiverName || (await resolveUserName(msg.receiverId || msg.receiver)),
          }))
        );

        return {
          ...conversation,
          _id: conversation._id.toString(),
          conversationId: conversation._id.toString(),
          messages: enrichedMessages,
          preview: last?.text || '',
          time: last?.createdAt || conversation.updatedAt || conversation.createdAt,
          lastMessageAt: last?.createdAt || conversation.lastMessageAt || conversation.updatedAt,
          user: participant.otherParticipantName,
          userName: participant.otherParticipantName,
          userId: participant.otherParticipantId,
          userAvatar: participant.otherParticipantAvatar,
        };
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getConversationById(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user?.id || req.query.user;
    const userIds = [req.user?.id, req.user?.firebaseUid, req.query.user].filter(Boolean).map(String);

    const conversation = await Conversation.findById(id).lean();
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const hasAccess = conversation.participants.some((p) => userIds.includes(String(p)));
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => ({
        ...msg,
        id: msg._id.toString(),
        senderName: msg.senderName || (await resolveUserName(msg.senderId || msg.sender)),
        receiverName: msg.receiverName || (await resolveUserName(msg.receiverId || msg.receiver)),
      }))
    );

    const participant = await resolveParticipantSummary(conversation.participants, req.user?.id || user, req.user?.firebaseUid);

    res.json({
      success: true,
      data: {
        ...conversation,
        _id: conversation._id.toString(),
        conversationId: conversation._id.toString(),
        messages: enrichedMessages,
        user: participant.otherParticipantName,
        userName: participant.otherParticipantName,
        userId: participant.otherParticipantId,
        userAvatar: participant.otherParticipantAvatar,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createOrGetConversation(req, res, next) {
  try {
    const { participants, recipientId, conversationType, relatedPost, relatedModel, createdBy } = req.body;
    const senderId = req.user?.id || createdBy;
    if (!senderId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Determine target recipient ID
    let rawRecipient = recipientId;
    if (!rawRecipient && Array.isArray(participants)) {
      rawRecipient = participants.find(
        (p) => String(p) !== String(senderId) && String(p) !== String(req.user?.firebaseUid)
      );
    }

    if (!rawRecipient) {
      return res.status(400).json({ success: false, message: 'Recipient is required.' });
    }

    // Resolve recipient to canonical MongoDB User ID
    const resolvedRecipientId = await resolveToUserId(rawRecipient);
    if (!resolvedRecipientId) {
      return res.status(400).json({ success: false, message: 'Unable to resolve recipient.' });
    }

    // A user cannot message themselves
    if (
      String(senderId) === String(resolvedRecipientId) ||
      (req.user?.firebaseUid && String(req.user.firebaseUid) === String(rawRecipient)) ||
      (req.user?.name && req.user.name.toLowerCase() === String(rawRecipient).toLowerCase())
    ) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself.' });
    }

    const normalizedParticipants = normalizeParticipantIds([senderId, resolvedRecipientId]);

    // Reuse existing conversation between these two users if it exists
    let existing = await Conversation.findOne({
      participants: { $all: normalizedParticipants, $size: 2 },
    });

    if (!existing && req.user?.firebaseUid) {
      existing = await Conversation.findOne({
        participants: { $all: [String(req.user.firebaseUid), String(rawRecipient)].sort(), $size: 2 },
      });
      if (existing) {
        existing.participants = normalizedParticipants;
        await existing.save();
      }
    }

    if (existing) {
      if (relatedPost) {
        existing.relatedPost = relatedPost;
        existing.relatedModel = relatedModel || existing.relatedModel || 'Post';
        existing.conversationType = conversationType || existing.conversationType || 'join_connect';
        await existing.save();
      }
      return res.status(200).json({ success: true, data: existing, created: false });
    }

    // Create a new conversation between the two users
    const conversation = await Conversation.create({
      participants: normalizedParticipants,
      conversationType: conversationType || 'join_connect',
      relatedPost: relatedPost || null,
      relatedModel: relatedModel || null,
      lastMessageAt: new Date(),
      createdBy: senderId,
    });

    res.status(201).json({ success: true, data: conversation, created: true });
  } catch (err) {
    next(err);
  }
}

export async function getConversationContext(req, res, next) {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id).lean();
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const userIds = [req.user?.id, req.user?.firebaseUid].filter(Boolean).map(String);
    if (userIds.length && !conversation.participants.some((p) => userIds.includes(String(p)))) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let reference = null;
    if (conversation.relatedPost && isMongoId(conversation.relatedPost)) {
      if (conversation.relatedModel === 'Post') {
        reference = await Post.findById(conversation.relatedPost).lean();
      } else if (conversation.relatedModel === 'HelpRequest') {
        reference = await HelpRequest.findById(conversation.relatedPost).lean();
      }
    }

    res.json({ success: true, data: { conversation, reference } });
  } catch (err) {
    next(err);
  }
}
