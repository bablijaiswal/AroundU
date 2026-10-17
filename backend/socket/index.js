import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';
import User from '../models/userModel.js';
import { verifyFirebaseToken } from '../config/firebaseAdmin.js';
import {
  normalizeParticipantIds,
  resolveToUserId,
  resolveUserName,
} from '../utils/chatParticipants.js';

export function initializeSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = await verifyFirebaseToken(token);
        if (decoded?.uid) {
          const user = await User.findOne({ firebaseUid: decoded.uid }).select('-passwordHash').lean();
          if (user) {
            socket.user = user;
            socket.userId = user._id.toString();
          }
        }
      }
    } catch (err) {
      // Allow unauthenticated connection initially; auth can be set on user:join
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Socket.io client connected: ${socket.id}`);
    socket.emit('socket:ready', { message: 'Connected to AroundU realtime server' });

    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      if (socket.user?.firebaseUid) {
        socket.join(`user:${socket.user.firebaseUid}`);
      }
    }

    socket.on('user:join', async (payload = {}) => {
      try {
        const { userId, mongoId, firebaseUid, token } = payload;

        if (token) {
          try {
            const decoded = await verifyFirebaseToken(token);
            if (decoded?.uid) {
              const user = await User.findOne({ firebaseUid: decoded.uid }).select('-passwordHash').lean();
              if (user) {
                socket.user = user;
                socket.userId = user._id.toString();
                socket.join(`user:${user._id.toString()}`);
                if (user.firebaseUid) socket.join(`user:${user.firebaseUid}`);
                console.log(`Socket ${socket.id} authenticated and joined user room ${user._id}`);
                return;
              }
            }
          } catch (tokenErr) {
            console.warn('Socket user:join token verification error:', tokenErr.message);
          }
        }

        const idsToJoin = [userId, mongoId, firebaseUid].filter(Boolean);
        idsToJoin.forEach((id) => {
          socket.join(`user:${String(id)}`);
        });

        if (idsToJoin.length) {
          console.log(`Socket ${socket.id} joined user rooms:`, idsToJoin);
        }
      } catch (err) {
        console.error('Error in user:join:', err);
      }
    });

    socket.on('conversation:join', ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket.io client ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(`conversation:${conversationId}`);
      console.log(`Socket.io client ${socket.id} left conversation ${conversationId}`);
    });

    socket.on('message:send', async (data = {}, callback) => {
      try {
        let senderId = socket.userId || socket.user?._id?.toString();
        let senderName = socket.user?.name;

        if (!senderId && data.token) {
          try {
            const decoded = await verifyFirebaseToken(data.token);
            const user = await User.findOne({ firebaseUid: decoded.uid }).select('-passwordHash').lean();
            if (user) {
              senderId = user._id.toString();
              senderName = user.name;
              socket.user = user;
              socket.userId = senderId;
            }
          } catch (e) {
            // token invalid
          }
        }

        if (!senderId) {
          if (callback) callback({ success: false, message: 'Authentication required' });
          return;
        }

        const trimmedText = String(data.text || '').trim();
        if (!trimmedText) {
          if (callback) callback({ success: false, message: 'Message text cannot be empty' });
          return;
        }

        let conversation = null;
        if (data.conversationId) {
          conversation = await Conversation.findById(data.conversationId);
        }

        let targetReceiver = data.receiverId || data.receiver;
        if (!targetReceiver && conversation) {
          targetReceiver = conversation.participants.find(
            (p) => String(p) !== String(senderId) && String(p) !== String(socket.user?.firebaseUid)
          );
        }

        if (!targetReceiver) {
          if (callback) callback({ success: false, message: 'Receiver is required' });
          return;
        }

        const resolvedReceiverId = await resolveToUserId(targetReceiver);
        if (!resolvedReceiverId) {
          if (callback) callback({ success: false, message: 'Unable to resolve receiver' });
          return;
        }

        if (String(senderId) === String(resolvedReceiverId)) {
          if (callback) callback({ success: false, message: 'Cannot message yourself' });
          return;
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
            conversationType: data.conversationType || 'join_connect',
            relatedPost: data.relatedPost || null,
            relatedModel: data.relatedModel || 'Post',
            lastMessageAt: new Date(),
            createdBy: senderId,
          });
        }

        const receiverName = await resolveUserName(resolvedReceiverId);

        const created = await Message.create({
          senderId,
          receiverId: resolvedReceiverId,
          senderName: senderName || 'AroundU User',
          receiverName: receiverName || 'Contact',
          sender: senderName || 'AroundU User',
          receiver: receiverName || 'Contact',
          text: trimmedText,
          conversationId: conversation._id,
          relatedPost: data.relatedPost || conversation.relatedPost || null,
          relatedModel: data.relatedModel || conversation.relatedModel || null,
          conversationType: conversation.conversationType,
        });

        await Conversation.findByIdAndUpdate(conversation._id, {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        });

        const messagePayload = {
          _id: created._id.toString(),
          id: created._id.toString(),
          senderId,
          senderName: created.senderName,
          receiverId: resolvedReceiverId,
          receiverName: created.receiverName,
          sender: created.senderName,
          receiver: created.receiverName,
          text: created.text,
          conversationId: conversation._id.toString(),
          relatedPost: created.relatedPost || null,
          relatedModel: created.relatedModel || null,
          conversationType: created.conversationType || conversation.conversationType || 'join_connect',
          createdAt: created.createdAt,
        };

        io.to(`conversation:${conversation._id}`)
          .to(`user:${resolvedReceiverId}`)
          .to(`user:${senderId}`)
          .emit('message:new', messagePayload);

        if (callback) callback({ success: true, data: messagePayload });
      } catch (err) {
        console.error('Socket message:send error:', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket.io client disconnected: ${socket.id}`);
    });
  });

  return io;
}
