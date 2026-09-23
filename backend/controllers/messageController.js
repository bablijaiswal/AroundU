import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';

export async function getMessages(req, res, next) {
  try {
    const { user } = req.query;
    if (!user) {
      return res.status(400).json({ success: false, message: 'user required' });
    }

    const conversations = await Conversation.find({ participants: user }).sort({ updatedAt: -1 }).lean();
    const result = await Promise.all(
      conversations.map(async (conversation) => {
        const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
        const last = messages[messages.length - 1];
        return {
          _id: conversation._id,
          user: conversation.participants.find((person) => person !== user),
          conversationId: conversation._id,
          conversationType: conversation.conversationType,
          relatedPost: conversation.relatedPost,
          relatedModel: conversation.relatedModel,
          preview: last?.text || '',
          time: last?.createdAt || conversation.updatedAt,
          unread: 0,
          messages,
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
    const sender = req.user?.name || req.body.sender;
    const { receiver, text, conversationId, relatedPost, relatedModel, conversationType } = req.body;
    if (!sender || !receiver || !text) {
      return res.status(400).json({ success: false, message: 'sender, receiver and text required' });
    }

    let conversation = null;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId).lean();
    }

    if (!conversation && relatedPost && relatedModel && conversationType) {
      const participants = [sender, receiver].sort();
      conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 },
        conversationType,
        relatedPost,
        relatedModel,
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sender, receiver].sort(),
        conversationType: conversationType || 'join_connect',
        relatedPost: relatedPost || null,
        relatedModel: relatedModel || 'Post',
      });
    }

    const created = await Message.create({
      sender,
      receiver,
      text,
      conversationId: conversation._id,
      relatedPost,
      relatedModel,
      conversationType: conversation.conversationType,
    });

    await Conversation.findByIdAndUpdate(conversation._id, { lastMessageAt: new Date(), updatedAt: new Date() });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

export async function getConversation(req, res, next) {
  try {
    const { userA, userB } = req.query;
    if (!userA || !userB) {
      return res.status(400).json({ success: false, message: 'userA and userB required' });
    }

    const participants = [userA, userB].sort();
    const conversation = await Conversation.findOne({ participants: { $all: participants, $size: 2 } }).lean();
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: { conversation, messages } });
  } catch (err) {
    next(err);
  }
}
