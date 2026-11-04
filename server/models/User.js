const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
const crypto   = require('crypto')

const userSchema = new mongoose.Schema(
  {
    shopName:        { type: String, required: true, trim: true },
    email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
    // PIN is the single credential — 4 digits, stored as a bcrypt hash
    pinHash:         { type: String, required: true, select: false },
    pinResetToken:   { type: String, select: false },
    pinResetExpires: { type: Date,   select: false },
  },
  { timestamps: true }
)

userSchema.statics.hashPin = (pin) => bcrypt.hash(String(pin), 10)

userSchema.methods.verifyPin = function (pin) {
  return bcrypt.compare(String(pin), this.pinHash)
}

userSchema.methods.createPinResetToken = function () {
  const raw = crypto.randomBytes(32).toString('hex')
  this.pinResetToken   = crypto.createHash('sha256').update(raw).digest('hex')
  this.pinResetExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 min
  return raw
}

module.exports = mongoose.model('User', userSchema)
