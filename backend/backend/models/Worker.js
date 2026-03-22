import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema(
  {
    name:         { type: String, required: [true, 'Name is required'], trim: true },
    worker_id:    { type: String, required: [true, 'Worker ID is required'], unique: true, trim: true },
    phone:        { type: String, trim: true, default: '' },
    wristband_id: { type: String, trim: true, default: '', sparse: true },

    health_status: {
      type: String,
      enum: ['Good', 'Warning', 'Critical'],
      default: 'Good',
    },
    heart_rate: { type: Number, default: 75, min: 0, max: 300 },
    spo2:       { type: Number, default: 98, min: 0, max: 100 },

    location: {
      lat:       { type: Number, default: 0 },
      lng:       { type: Number, default: 0 },
      address:   { type: String, default: '' },
      updatedAt: { type: Date,   default: Date.now },
    },

    current_job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },

    status: {
      type: String,
      enum: ['active', 'idle', 'emergency', 'off-duty'],
      default: 'idle',
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

workerSchema.index({ worker_id: 1 });
workerSchema.index({ status: 1 });

export default mongoose.model('Worker', workerSchema);