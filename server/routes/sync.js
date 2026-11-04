const express     = require('express')
const router      = express.Router()
const requireAuth = require('../middleware/auth')
const SyncRecord  = require('../models/SyncRecord')

// ── POST /api/sync/push ───────────────────────────────────────────────────────
// App pushes an array of changed records to the server.
// Body: { records: [{ table, localId, data, clientTs, deletedAt? }] }
router.post('/push', requireAuth, async (req, res) => {
  try {
    const { records } = req.body
    if (!Array.isArray(records))
      return res.status(400).json({ error: 'records must be an array' })

    if (records.length === 0) return res.json({ synced: 0 })

    const userId = req.user._id
    const ops    = records.map(r => ({
      updateOne: {
        filter: { userId, table: r.table, localId: String(r.localId) },
        update: {
          $set: {
            data:      r.data,
            clientTs:  r.clientTs ?? Date.now(),
            deletedAt: r.deletedAt ?? null,
          },
        },
        upsert: true,
      },
    }))

    const result = await SyncRecord.bulkWrite(ops, { ordered: false })
    res.json({ synced: result.upsertedCount + result.modifiedCount })
  } catch (err) {
    console.error('sync/push:', err.message)
    res.status(500).json({ error: 'Push failed' })
  }
})

// ── GET /api/sync/pull?since=<epoch_ms> ──────────────────────────────────────
// Returns all records updated after `since`. Used by the app to pull cloud changes.
router.get('/pull', requireAuth, async (req, res) => {
  try {
    const since   = parseInt(req.query.since || '0', 10)
    const records = await SyncRecord.find({
      userId:    req.user._id,
      updatedAt: { $gt: new Date(since) },
    }).lean()

    res.json({ records, serverTime: Date.now() })
  } catch (err) {
    console.error('sync/pull:', err.message)
    res.status(500).json({ error: 'Pull failed' })
  }
})

// ── GET /api/sync/all ─────────────────────────────────────────────────────────
// Web app: fetch all active records for this user, grouped by table.
router.get('/all', requireAuth, async (req, res) => {
  try {
    const records = await SyncRecord.find({
      userId:    req.user._id,
      deletedAt: null,
    }).lean()

    const grouped = {}
    for (const r of records) {
      if (!grouped[r.table]) grouped[r.table] = []
      grouped[r.table].push(r.data)
    }

    res.json(grouped)
  } catch (err) {
    console.error('sync/all:', err.message)
    res.status(500).json({ error: 'Failed to load data' })
  }
})

// ── GET /api/sync/stats ───────────────────────────────────────────────────────
// Record counts per table — used by the dashboard sync indicator.
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const counts = await SyncRecord.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$table', count: { $sum: 1 } } },
    ])
    res.json(counts)
  } catch (err) {
    console.error('sync/stats:', err.message)
    res.status(500).json({ error: 'Stats failed' })
  }
})

module.exports = router
