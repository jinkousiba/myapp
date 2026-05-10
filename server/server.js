require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001
const DATA_FILE = path.join(__dirname, 'data.json')

// ── 環境変数チェック ───────────────────────────────
const API_SECRET = process.env.API_SECRET
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN // 例: https://myapp-xxx.vercel.app

if (!API_SECRET) {
  console.error('❌ 環境変数 API_SECRET が設定されていません。server/.env を確認してください。')
  process.exit(1)
}

// ── CORS（許可ドメインのみ） ───────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // ツール・curl等でのテスト用にoriginなしも許可（本番では外してもOK）
    if (!origin) return callback(null, true)
    if (!ALLOWED_ORIGIN || origin === ALLOWED_ORIGIN) return callback(null, true)
    callback(new Error(`CORS: ${origin} は許可されていません`))
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}))

app.use(express.json())

// ── API キー認証ミドルウェア ───────────────────────
function authenticate(req, res, next) {
  const auth = req.headers['authorization'] || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (token !== API_SECRET) {
    return res.status(401).json({ error: '認証に失敗しました' })
  }
  next()
}

app.use('/api', authenticate)

// ── データ読み書き ────────────────────────────────
function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }
  catch { return { tasks: [], transactions: [] } }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

if (!fs.existsSync(DATA_FILE)) writeData({ tasks: [], transactions: [] })

// ── タスク ──────────────────────────────────────
app.get('/api/tasks', (req, res) => res.json(readData().tasks))

app.post('/api/tasks', (req, res) => {
  const data = readData()
  const task = { ...req.body, id: req.body.id || Date.now() }
  data.tasks = data.tasks.filter(t => t.id !== task.id)
  data.tasks.push(task)
  writeData(data)
  res.json(task)
})

app.patch('/api/tasks/:id', (req, res) => {
  const data = readData()
  const id = Number(req.params.id)
  data.tasks = data.tasks.map(t => t.id === id ? { ...t, ...req.body } : t)
  writeData(data)
  res.json(data.tasks.find(t => t.id === id) || {})
})

app.delete('/api/tasks/:id', (req, res) => {
  const data = readData()
  data.tasks = data.tasks.filter(t => t.id !== Number(req.params.id))
  writeData(data)
  res.json({ ok: true })
})

// ── 収支 ─────────────────────────────────────────
app.get('/api/transactions', (req, res) => res.json(readData().transactions))

app.post('/api/transactions', (req, res) => {
  const data = readData()
  const tx = { ...req.body, id: req.body.id || Date.now() }
  data.transactions = data.transactions.filter(t => t.id !== tx.id)
  data.transactions.push(tx)
  writeData(data)
  res.json(tx)
})

app.delete('/api/transactions/:id', (req, res) => {
  const data = readData()
  data.transactions = data.transactions.filter(t => t.id !== Number(req.params.id))
  writeData(data)
  res.json({ ok: true })
})

// ── 起動 ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ MyApp サーバー起動中 → http://localhost:${PORT}`)
  console.log(`🔒 API キー認証: 有効`)
  console.log(`🌐 許可ドメイン: ${ALLOWED_ORIGIN || '未設定（全許可）'}`)
  console.log(`📁 データ保存先: ${DATA_FILE}`)
})
