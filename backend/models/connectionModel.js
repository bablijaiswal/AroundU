import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema(
  {
    requester: { type: String, required: true },
    receiver: { type: String, required: true },
    relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

const Connection = mongoose.models.Connection || mongoose.model('Connection', connectionSchema);
export default Connection;
