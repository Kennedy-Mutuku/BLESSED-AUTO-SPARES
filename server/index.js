const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

const origins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : '*'

app.use(cors({ origin: origins, credentials: true }))
app.use(express.json({ limit: '20mb' }))

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => {
    console.error('✗ MongoDB:', err.message)
    process.exit(1)
  })

app.use('/api/auth', require('./routes/auth'))
app.use('/api/sync', require('./routes/sync'))

app.get('/api/health', (_, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
)

app.use((_, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = parseInt(process.env.PORT || '5000', 10)
app.listen(PORT, () => console.log(`✓ API listening on port ${PORT}`))
