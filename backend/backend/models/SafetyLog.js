import mongoose from 'mongoose';

const safetyLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Alert', 'Vitals', 'Job', 'Sensor', 'Auth', 'System'],
      required: true,
    },
    event:      { type: String, required: true },
    severity:   { type: String, enum: ['critical', 'warning', 'info'], default: 'info' },
    workerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', default: null },
    jobId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    siteId:     { type: String, default: null },
    actorId:    { type: mongoose.Schema.Types.ObjectId, default: null },   // supervisor or system
    actorType:  { type: String, enum: ['supervisor', 'system', 'device'], default: 'system' },
    metadata:   { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp:  { type: Date, default: Date.now },
  },
  { timestamps: false }
);

safetyLogSchema.index({ timestamp: -1 });
safetyLogSchema.index({ type: 1, timestamp: -1 });

export default mongoose.model('SafetyLog', safetyLogSchema);
