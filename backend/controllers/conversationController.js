import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';
import Post from '../models/postModel.js';
import HelpRequest from '../models/helpRequestModel.js';

function normalizeParticipants(a, b) {
  return [a, b].sort();
}

export async function getConversations(req, res, next) {
  try {
    const { user } = req.query;
    if (!user) return res.status(400).json({ success: false, message: 'user required' });

    const conversations = await Conversation.find({ participants: user }).sort({ updatedAt: -1 }).lean();

    const result = await Promise.all(
      conversations.map(async (conversation) => {
        const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
        return {
          ...conversation,
          messages,
          preview: messages[messages.length - 1]?.text || '',
          lastMessageAt: messages[messages.length - 1]?.createdAt || conversation.updatedAt,
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
    const { user } = req.query;

    const conversation = await Conversation.findById(id).lean();
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    if (!conversation.participants.includes(user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: { ...conversation, messages } });
  } catch (err) {
    next(err);
  }
}

export async function createOrGetConversation(req, res, next) {
  try {
    const { participants, conversationType, relatedPost, relatedModel, createdBy } = req.body;
    if (!participants || participants.length !== 2) {
      return res.status(400).json({ success: false, message: 'exactly two participants required' });
    }
    if (!conversationType || !relatedPost || !relatedModel) {
      return res.status(400).json({ success: false, message: 'conversationType, relatedPost and relatedModel required' });
    }

    const normalizedParticipants = normalizeParticipants(participants[0], participants[1]);
    const existing = await Conversation.findOne({
      participants: { $all: normalizedParticipants, $size: 2 },
      conversationType,
      relatedPost,
      relatedModel,
    }).lean();

    if (existing) {
      return res.status(200).json({ success: true, data: existing, created: false });
    }

    const conversation = await Conversation.create({
      participants: normalizedParticipants,
      conversationType,
      relatedPost,
      relatedModel,
      lastMessageAt: new Date(),
      createdBy,
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

    let reference = null;
    if (conversation.relatedModel === 'Post') {
      reference = await Post.findById(conversation.relatedPost).lean();
    }
    if (conversation.relatedModel === 'HelpRequest') {
      reference = await HelpRequest.findById(conversation.relatedPost).lean();
    }

    res.json({ success: true, data: { conversation, reference } });
  } catch (err) {
    next(err);
  }
}
