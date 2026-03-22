import mongoose from 'mongoose';

const vitalsSchema = new mongoose.Schema(
  {
    workerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    jobId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    heartRate:    { type: Number, required: true, min: 0, max: 300 },
    spO2:         { type: Number, required: true, min: 0, max: 100 },
    fallDetected: { type: Boolean, default: false },
    sosPressed:   { type: Boolean, default: false },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    timestamp:    { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// TTL index — auto-delete raw vitals after 30 days
vitalsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
vitalsSchema.index({ workerId: 1, timestamp: -1 });

export default mongoose.model('Vitals', vitalsSchema);
