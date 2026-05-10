const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001
const DATA_FILE = path.join(__dirname, 'data.json')

app.use(cors())
app.use(express.json())

// ── データ読み書き ────────────────────────────────
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch {
    return { tasks: [], transactions: [] }
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

// 起動時にファイルがなければ作成
if (!fs.existsSync(DATA_FILE)) {
  writeData({ tasks: [], transactions: [] })
}

// ── タスク ──────────────────────────────────────
app.get('/api/tasks', (req, res) => {
  res.json(readData().tasks)
})

app.post('/api/tasks', (req, res) => {
  const data = readData()
  const task = { ...req.body, id: req.body.id || Date.now() }
  data.tasks = data.tasks.filter(t => t.id !== task.id) // 重複排除
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
app.get('/api/transactions', (req, res) => {
  res.json(readData().transactions)
})

app.post('/api/transactions', (req, res) => {
  const data = readData()
  const tx = { ...req.body, id: req.body.id || Date.now() }
  data.transactions = data.transactions.filter(t => t.id !== tx.id) // 重複排除
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
  console.log(`📁 データ保存先: ${DATA_FILE}`)
})
