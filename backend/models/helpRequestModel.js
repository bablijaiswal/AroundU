import mongoose from 'mongoose';

const helpRequestSchema = new mongoose.Schema(
  {
    creator: { type: String, default: '' },
    creatorId: { type: String, required: true },
    creatorName: { type: String, default: '' },
    type: { type: String, enum: ['need_help', 'can_help'], required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'Other' },
    location: { type: String },
    date: { type: Date },
    time: { type: String },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    responders: [{ type: String }],
  },
  { timestamps: true }
);

const HelpRequest = mongoose.models.HelpRequest || mongoose.model('HelpRequest', helpRequestSchema);
export default HelpRequest;
