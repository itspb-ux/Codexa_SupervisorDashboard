import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true, trim: true },
    description:  { type: String, trim: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supervisor', required: true },
    workerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    site:         { type: String, required: true, trim: true },
    siteId:       { type: String, trim: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Emergency'],
      default: 'Pending',
    },
    startedAt:    { type: Date, default: null },
    endedAt:      { type: Date, default: null },
    estimatedEnd: { type: Date, default: null },
    notes:        { type: String, trim: true },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1 });
jobSchema.index({ workerId: 1, status: 1 });
jobSchema.index({ supervisorId: 1 });

export default mongoose.model('Job', jobSchema);
