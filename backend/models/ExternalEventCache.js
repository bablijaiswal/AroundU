import mongoose from 'mongoose';

const externalEventCacheSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, unique: true, index: true },
    events: { type: [mongoose.Schema.Types.Mixed], default: [] },
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const ExternalEventCache = mongoose.models.ExternalEventCache || mongoose.model('ExternalEventCache', externalEventCacheSchema);

export default ExternalEventCache;