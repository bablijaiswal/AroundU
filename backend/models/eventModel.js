import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    category: { type: String, default: 'Community' },
    date: { type: Date, required: true },
    startTime: { type: String },
    endTime: { type: String },
    venue: { type: String },
    address: { type: String },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    organizer: { type: String },
    externalLink: { type: String },
    priceInformation: { type: String },
  },
  { timestamps: true }
);

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
export default Event;
