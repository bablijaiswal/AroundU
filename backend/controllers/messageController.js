import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';
import {
  normalizeParticipantIds,
  resolveParticipantSummary,
  resolveToUserId,
  resolveUserName,
} from '../utils/chatParticipants.js';

export async function getMessages(req, res, next) {
  try {
    const user = req.user?.id || req.query.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userIds = [req.user?.id, req.user?.firebaseUid, req.query.user].filter(Boolean).map(String);

    const conversations = await Conversation.find({ participants: { $in: userIds } })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const result = await Promise.all(
      conversations.map(async (conversation) => {
        const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
        const last = messages[messages.length - 1];
        const participant = await resolveParticipantSummary(conversation.participants, req.user?.id || user, req.user?.firebaseUid);

        const enrichedMessages = await Promise.all(
          messages.map(async (message) => ({
            ...message,
            id: message._id.toString(),
            senderName: message.senderName || (await resolveUserName(message.senderId || message.sender)),
            receiverName: message.receiverName || (await resolveUserName(message.receiverId || message.receiver)),
          }))
        );

        return {
          _id: conversation._id.toString(),
          user: participant.otherParticipantName,
          userId: participant.otherParticipantId,
          userName: participant.otherParticipantName,
          userAvatar: participant.otherParticipantAvatar,
          conversationId: conversation._id.toString(),
          conversationType: conversation.conversationType,
          relatedPost: conversation.relatedPost,
          relatedModel: conversation.relatedModel,
          preview: last?.text || '',
          time: last?.createdAt || conversation.updatedAt || conversation.createdAt,
          lastMessageAt: last?.createdAt || conversation.lastMessageAt || conversation.updatedAt,
          unread: 0,
          messages: enrichedMessages,
        };
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function createMessage(req, res, next) {
  try {
    const senderId = req.user?.id;
    const senderName = req.user?.name || 'AroundU User';
    const { receiverId, receiver, text, conversationId, relatedPost, relatedModel, conversationType } = req.body;

    if (!senderId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
    }

    let conversation = null;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (conversation) {
        const userIds = [senderId, req.user?.firebaseUid].filter(Boolean).map(String);
        const isParticipant = conversation.participants.some((p) => userIds.includes(String(p)));
        if (!isParticipant) {
          return res.status(403).json({ success: false, message: 'Not authorized for this conversation.' });
        }
      }
    }

    let targetReceiver = receiverId || receiver;
    if (!targetReceiver && conversation) {
      targetReceiver = conversation.participants.find(
        (p) => String(p) !== String(senderId) && String(p) !== String(req.user?.firebaseUid)
      );
    }

    if (!targetReceiver) {
      return res.status(400).json({ success: false, message: 'Receiver is required.' });
    }

    const resolvedReceiverId = await resolveToUserId(targetReceiver);
    if (!resolvedReceiverId) {
      return res.status(400).json({ success: false, message: 'Unable to resolve receiver.' });
    }

    // A user cannot message themselves
    if (
      String(senderId) === String(resolvedReceiverId) ||
      (req.user?.firebaseUid && String(req.user.firebaseUid) === String(targetReceiver))
    ) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself.' });
    }

    const participants = normalizeParticipantIds([senderId, resolvedReceiverId]);

    if (!conversation) {
      conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 },
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        conversationType: conversationType || 'join_connect',
        relatedPost: relatedPost || null,
        relatedModel: relatedModel || 'Post',
        lastMessageAt: new Date(),
        createdBy: senderId,
      });
    }

    const receiverName = await resolveUserName(resolvedReceiverId);

    const created = await Message.create({
      senderId,
      receiverId: resolvedReceiverId,
      senderName,
      receiverName: receiverName || 'Contact',
      sender: senderName,
      receiver: receiverName || 'Contact',
      text: trimmedText,
      conversationId: conversation._id,
      relatedPost: relatedPost || conversation.relatedPost || null,
      relatedModel: relatedModel || conversation.relatedModel || null,
      conversationType: conversation.conversationType,
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    });

    const io = req.app.get('io');
    const messagePayload = {
      _id: created._id.toString(),
      id: created._id.toString(),
      senderId,
      senderName,
      receiverId: resolvedReceiverId,
      receiverName: created.receiverName,
      sender: senderName,
      receiver: created.receiverName,
      text: created.text,
      conversationId: conversation._id.toString(),
      relatedPost: created.relatedPost || null,
      relatedModel: created.relatedModel || null,
      conversationType: created.conversationType || conversation.conversationType || 'join_connect',
      createdAt: created.createdAt,
    };

    if (io) {
      io.to(`conversation:${conversation._id}`)
        .to(`user:${resolvedReceiverId}`)
        .to(`user:${senderId}`)
        .emit('message:new', messagePayload);
    }

    res.status(201).json({ success: true, data: messagePayload });
  } catch (err) {
    next(err);
  }
}

export async function getConversation(req, res, next) {
  try {
    const userA = req.user?.id || req.query.userA;
    const userB = req.query.userB;
    if (!userA || !userB) {
      return res.status(400).json({ success: false, message: 'userA and userB required.' });
    }

    const resolvedA = (await resolveToUserId(userA)) || userA;
    const resolvedB = (await resolveToUserId(userB)) || userB;

    const participants = normalizeParticipantIds([resolvedA, resolvedB]);
    const conversation = await Conversation.findOne({ participants: { $all: participants, $size: 2 } }).lean();
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => ({
        ...message,
        id: message._id.toString(),
        senderName: message.senderName || (await resolveUserName(message.senderId || message.sender)),
        receiverName: message.receiverName || (await resolveUserName(message.receiverId || message.receiver)),
      }))
    );

    const participant = await resolveParticipantSummary(conversation.participants, userA, req.user?.firebaseUid);
    res.json({ success: true, data: { conversation, messages: enrichedMessages, participant } });
  } catch (err) {
    next(err);
  }
}
