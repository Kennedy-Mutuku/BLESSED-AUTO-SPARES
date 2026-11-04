const mongoose = require('mongoose')

// One document per (userId + table + localId).
// 'data' stores the full client record as-is — schema-agnostic.
const schema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    table:     { type: String, required: true }, // products | sales | categories | stockHistory | settings
    localId:   { type: String, required: true }, // Dexie primary key (string)
    data:      { type: mongoose.Schema.Types.Mixed },
    clientTs:  { type: Number, required: true }, // client-side timestamp for conflict resolution
    deletedAt: { type: Number, default: null },  // null = active; number = soft-deleted
  },
  { timestamps: true } // createdAt / updatedAt managed by Mongo — used for incremental pull
)

// Fast upsert
schema.index({ userId: 1, table: 1, localId: 1 }, { unique: true })
// Incremental pull: "give me all records updated since X"
schema.index({ userId: 1, updatedAt: 1 })

module.exports = mongoose.model('SyncRecord', schema)
