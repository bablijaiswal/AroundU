import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: String, required: true }],
    conversationType: {
      type: String,
      enum: ['join_connect', 'help_request'],
      required: true,
    },
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedModel',
      required: true,
    },
    relatedModel: {
      type: String,
      enum: ['Post', 'HelpRequest'],
      required: true,
    },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
export default Conversation;
