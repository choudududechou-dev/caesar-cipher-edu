import { Router } from 'express'
import { encrypt, decrypt, bruteforce, frequencyAnalysis, getMappingTable } from '../services/cipherService'

const router = Router()

// POST /api/cipher/encode
router.post('/encode', (req, res) => {
  const { text, shift } = req.body
  if (!text || shift === undefined) {
    return res.status(400).json({ error: 'Missing text or shift' })
  }
  const result = encrypt(text, Number(shift))
  const mapping = getMappingTable(Number(shift))
  res.json({ result, mapping, shift: Number(shift) })
})

// POST /api/cipher/decode
router.post('/decode', (req, res) => {
  const { text, shift } = req.body
  if (!text || shift === undefined) {
    return res.status(400).json({ error: 'Missing text or shift' })
  }
  const result = decrypt(text, Number(shift))
  const mapping = getMappingTable(Number(shift))
  res.json({ result, mapping, shift: Number(shift) })
})

// POST /api/cipher/bruteforce
router.post('/bruteforce', (req, res) => {
  const { text } = req.body
  if (!text) {
    return res.status(400).json({ error: 'Missing text' })
  }
  const candidates = bruteforce(text)
  res.json({ candidates })
})

// POST /api/cipher/frequency
router.post('/frequency', (req, res) => {
  const { text } = req.body
  if (!text) {
    return res.status(400).json({ error: 'Missing text' })
  }
  const frequencies = frequencyAnalysis(text)
  res.json({ frequencies })
})

// GET /api/cipher/mapping?shift=3
router.get('/mapping', (req, res) => {
  const shift = Number(req.query.shift) || 0
  const mapping = getMappingTable(shift)
  res.json({ mapping, shift })
})

export default router
