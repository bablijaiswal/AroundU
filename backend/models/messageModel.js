import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
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

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export default Message;
