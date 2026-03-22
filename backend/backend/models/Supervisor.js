import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const supervisorSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ['supervisor', 'admin'], default: 'supervisor' },
    phone:        { type: String, trim: true },
    shift:        { type: String, default: '06:00 AM – 02:00 PM' },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before save
supervisorSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password
supervisorSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Never return passwordHash in JSON
supervisorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model('Supervisor', supervisorSchema);
