import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    senderName: { type: String, default: '' },
    receiverName: { type: String, default: '' },
    sender: { type: String, default: '' },
    receiver: { type: String, default: '' },
    text: { type: String, required: true, trim: true },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    relatedPost: { type: String, default: null },
    relatedModel: {
      type: String,
      enum: ['Post', 'HelpRequest', null],
      default: null,
    },
    conversationType: {
      type: String,
      enum: ['join_connect', 'help_request', null],
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export default Message;
