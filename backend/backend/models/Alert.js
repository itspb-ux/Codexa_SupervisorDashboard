import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Gas Leak', 'Low Oxygen', 'High CH4', 'Water Rise', 'Fall Detected', 'SOS Button', 'High Heart Rate', 'Low SpO2', 'Tilt'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Acknowledged', 'Resolved'],
      default: 'Active',
    },
    message:      { type: String, required: true },
    workerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', default: null },
    jobId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    siteId:       { type: String, default: null },
    value:        { type: Number, default: null },   // actual sensor value that triggered
    threshold:    { type: Number, default: null },   // threshold that was breached
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Supervisor', default: null },
    resolvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Supervisor', default: null },
    triggeredAt:  { type: Date, default: Date.now },
    resolvedAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

alertSchema.index({ status: 1, severity: 1 });
alertSchema.index({ workerId: 1, triggeredAt: -1 });
alertSchema.index({ triggeredAt: -1 });

export default mongoose.model('Alert', alertSchema);
