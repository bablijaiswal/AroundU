import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: String, required: true, index: true }],
    conversationType: {
      type: String,
      enum: ['join_connect', 'help_request'],
      default: 'join_connect',
    },
    relatedPost: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    relatedModel: {
      type: String,
      enum: ['Post', 'HelpRequest', null],
      default: null,
    },
    lastMessageAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
export default Conversation;
