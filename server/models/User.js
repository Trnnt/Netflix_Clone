import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, minlength: 6, select: false },
  role:        { type: String, enum: ['user', 'admin'], default: 'user' },
  plan:        { type: String, enum: ['Basic', 'Standard', 'Premium'], default: 'Standard' },
  status:      { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  watch_hours: { type: Number, default: 0 },
}, { timestamps: true });

// ── Hash password before saving ──────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Instance method to compare passwords ─────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Strip password from JSON output ──────────────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
