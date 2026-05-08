const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  phone:     { type: String, required: true, unique: true, trim: true, match: /^[6-9]\d{9}$/ },
  password:  { type: String, required: true, minlength: 6 },

  // ── Role (Phase 1) ─────────────────────────────────────────────────────────
  role:      { type: String, enum: ['farmer', 'veterinarian', 'company'], default: 'farmer' },

  // ── Farmer fields ──────────────────────────────────────────────────────────
  farmName:  { type: String, required: false, trim: true, default: '' }, // optional — added via onboarding
  village:   { type: String, trim: true, default: '' },
  district:  { type: String, trim: true, default: '' },
  state:     { type: String, trim: true, default: 'Maharashtra' },
  farmSize:  { type: String, default: '' },

  // ── Org fields (vet clinic / company name — Phase 2/3) ────────────────────
  orgName:   { type: String, trim: true, default: '' },

  // ── Common ────────────────────────────────────────────────────────────────
  lang:      { type: String, enum: ['en', 'hi', 'mr'], default: 'en' },
  joinDate:  { type: Date, default: Date.now },
  isActive:  { type: Boolean, default: true },

  // ── Progressive onboarding tracker (Phase 1) ──────────────────────────────
  onboardingStep: { type: Number, default: 0 }, // 0=start, 1=cows added, 2=milk logged, 3=complete

  // ── Subscription (Phase 4 — stored now for schema readiness) ──────────────
  subscription: {
    plan:      { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    expiresAt: { type: Date },
  },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Never return password in JSON
userSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.password; return ret; }
});

module.exports = mongoose.model('User', userSchema);
