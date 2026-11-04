const express = require('express')
const jwt     = require('jsonwebtoken')
const crypto  = require('crypto')
const router  = express.Router()

const User              = require('../models/User')
const SyncRecord        = require('../models/SyncRecord')
const { sendPinResetEmail } = require('../utils/email')

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '90d',
  })
}

function validatePin(pin) {
  return /^\d{4}$/.test(String(pin))
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
// Called from the app when an existing offline user links their cloud account.
// PIN = their current 4-digit app PIN.
router.post('/register', async (req, res) => {
  try {
    const { shopName, email, pin } = req.body
    if (!shopName?.trim() || !email?.trim() || !pin)
      return res.status(400).json({ error: 'shopName, email and pin are required' })
    if (!validatePin(pin))
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' })

    const exists = await User.findOne({ email: email.toLowerCase().trim() })
    if (exists) return res.status(409).json({ error: 'An account with that email already exists' })

    const pinHash = await User.hashPin(pin)
    const user    = await User.create({ shopName: shopName.trim(), email, pinHash })

    res.status(201).json({
      token: signToken(user._id),
      user: { id: user._id, shopName: user.shopName, email: user.email },
    })
  } catch (err) {
    console.error('register:', err.message)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────
// Web: email + 4-digit PIN.
router.post('/login', async (req, res) => {
  try {
    const { email, pin } = req.body
    if (!email || !pin)
      return res.status(400).json({ error: 'Email and PIN are required' })
    if (!validatePin(pin))
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' })

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+pinHash')
    const ok   = user && (await user.verifyPin(pin))
    if (!ok) return res.status(401).json({ error: 'Invalid email or PIN' })

    res.json({
      token: signToken(user._id),
      user: { id: user._id, shopName: user.shopName, email: user.email },
    })
  } catch (err) {
    console.error('login:', err.message)
    res.status(500).json({ error: 'Login failed' })
  }
})

// ── POST /api/auth/forgot-pin ─────────────────────────────────────────────────
router.post('/forgot-pin', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (user) {
      const rawToken = user.createPinResetToken()
      await user.save()
      const webBase  = (process.env.WEB_BASE_URL || 'http://localhost:5173').replace(/\/$/, '')
      const resetUrl = `${webBase}/reset-pin?token=${rawToken}`
      await sendPinResetEmail({ to: user.email, shopName: user.shopName, resetUrl })
    }

    // Always return success to prevent email enumeration
    res.json({ message: 'If that email is registered, a reset link has been sent.' })
  } catch (err) {
    console.error('forgot-pin:', err.message)
    res.status(500).json({ error: 'Could not send reset email. Please try again.' })
  }
})

// ── POST /api/auth/reset-pin ──────────────────────────────────────────────────
router.post('/reset-pin', async (req, res) => {
  try {
    const { token, newPin } = req.body
    if (!token || !newPin)
      return res.status(400).json({ error: 'token and newPin are required' })
    if (!validatePin(newPin))
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' })

    const hashed = crypto.createHash('sha256').update(token).digest('hex')
    const user   = await User
      .findOne({ pinResetToken: hashed, pinResetExpires: { $gt: new Date() } })
      .select('+pinHash +pinResetToken +pinResetExpires')

    if (!user) return res.status(400).json({ error: 'Reset link is invalid or has expired' })

    // Update pinHash on the user document
    user.pinHash         = await User.hashPin(newPin)
    user.pinResetToken   = undefined
    user.pinResetExpires = undefined
    await user.save()

    // Also write the new plain PIN into SyncRecords so the app picks it up on next pull
    await SyncRecord.findOneAndUpdate(
      { userId: user._id, table: 'settings', localId: 'appPin' },
      { $set: { data: { key: 'appPin', value: newPin }, clientTs: Date.now(), deletedAt: null } },
      { upsert: true }
    )

    res.json({ message: 'PIN reset successfully', token: signToken(user._id) })
  } catch (err) {
    console.error('reset-pin:', err.message)
    res.status(500).json({ error: 'PIN reset failed' })
  }
})

// ── POST /api/auth/verify-token ───────────────────────────────────────────────
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ error: 'token required' })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user    = await User.findById(payload.sub).lean()
    if (!user) return res.status(401).json({ error: 'User not found' })
    res.json({ user: { id: user._id, shopName: user.shopName, email: user.email } })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

module.exports = router
