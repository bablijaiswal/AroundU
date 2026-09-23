import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    creator: { type: String, default: '' },
    creatorId: { type: String, required: true },
    creatorName: { type: String, default: '' },
    type: { type: String, default: 'post' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    eventRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    activity: { type: String },
    category: { type: String },
    location: { type: String },
    date: { type: Date },
    time: { type: String },
    peopleNeeded: { type: Number, default: 1 },
    currentInterestedCount: { type: Number, default: 0 },
    status: { type: String, default: 'open' },
  },
  { timestamps: true }
);

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
export default Post;
