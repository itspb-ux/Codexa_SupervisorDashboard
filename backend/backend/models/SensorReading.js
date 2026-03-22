import mongoose from 'mongoose';

const sensorReadingSchema = new mongoose.Schema(
  {
    siteId:       { type: String, required: true, trim: true },
    jobId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    deviceId:     { type: String, trim: true },

    // Gas sensors
    h2sLevel:     { type: Number, default: 0, min: 0 },   // ppm
    ch4Level:     { type: Number, default: 0, min: 0 },   // % LEL
    o2Level:      { type: Number, default: 20.9, min: 0 }, // %
    coLevel:      { type: Number, default: 0, min: 0 },   // ppm (optional)

    // Physical sensors
    waterLevel:   { type: Number, default: 0, min: 0 },   // cm
    tiltAngle:    { type: Number, default: 0 },            // degrees
    temperature:  { type: Number, default: 25 },           // °C

    safetyStatus: {
      type: String,
      enum: ['Safe', 'Warn', 'Unsafe'],
      default: 'Safe',
    },

    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// TTL — keep raw readings for 90 days
sensorReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
sensorReadingSchema.index({ siteId: 1, timestamp: -1 });

export default mongoose.model('SensorReading', sensorReadingSchema);
