import { useState } from 'react'
import { useAppContext } from '../AppContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'

const CATEGORIES = {
  income: ['給与', '副収入', '賞与', '投資', 'その他収入'],
  expense: ['住居費', '食費', '交通費', '光熱費', '娯楽費', '医療費', '衣服費', 'その他'],
}

const today = new Date().toISOString().slice(0, 10)

export default function AccountingPage() {
  const { transactions, summary, addTransaction, deleteTransaction } = useAppContext()
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES.expense[0])
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today)
  const [filter, setFilter] = useState('all')

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseInt(amount, 10)
    if (!num || num <= 0 || !category) return
    addTransaction({ type, amount: num, category, description: description.trim(), date })
    setAmount('')
    setDescription('')
    setDate(today)
  }

  const handleTypeChange = (t) => {
    setType(t)
    setCategory(CATEGORIES[t][0])
  }

  const filtered = transactions.filter(tx => {
    if (filter === 'income') return tx.type === 'income'
    if (filter === 'expense') return tx.type === 'expense'
    return true
  })
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date))

  // カテゴリ別集計（支出のみ）
  const categoryMap = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount
  })
  const chartData = Object.entries(categoryMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)

  const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#818cf8', '#4f46e5']

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">収支管理</h1>
        <div className="balance-badge">
          残高 {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString()}円
        </div>
      </div>

      {/* サマリー */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">収入合計</div>
          <div className="stat-value income">{summary.totalIncome.toLocaleString()}円</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">支出合計</div>
          <div className="stat-value expense">{summary.totalExpense.toLocaleString()}円</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">収支バランス</div>
          <div className={`stat-value ${summary.balance >= 0 ? 'income' : 'expense'}`}>
            {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString()}円
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">件数</div>
          <div className="stat-value neutral">{transactions.length}件</div>
        </div>
      </div>

      {/* カテゴリ別グラフ */}
      {chartData.length > 0 && (
        <div className="chart-card">
          <h2 className="section-title">支出カテゴリ別集計</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 10000).toFixed(0)}万`} />
              <Tooltip formatter={(v) => [`${v.toLocaleString()}円`, '支出']} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 登録フォーム */}
      <div className="form-card">
        <h2 className="section-title">収支を登録</h2>
        <form className="tx-form" onSubmit={handleSubmit}>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-btn ${type === 'income' ? 'type-income' : ''}`}
              onClick={() => handleTypeChange('income')}
            >収入</button>
            <button
              type="button"
              className={`type-btn ${type === 'expense' ? 'type-expense' : ''}`}
              onClick={() => handleTypeChange('expense')}
            >支出</button>
          </div>
          <div className="tx-fields">
            <input
              className="tx-input"
              type="number"
              placeholder="金額（円）"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
              required
            />
            <select
              className="tx-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              className="tx-input"
              type="text"
              placeholder="説明（任意）"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <input
              className="tx-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <button className="btn-primary" type="submit">登録</button>
          </div>
        </form>
      </div>

      {/* 一覧 */}
      <div className="filter-tabs">
        {[['all', 'すべて'], ['income', '収入のみ'], ['expense', '支出のみ']].map(([v, l]) => (
          <button
            key={v}
            className={`filter-tab ${filter === v ? 'active' : ''}`}
            onClick={() => setFilter(v)}
          >
            {l}
          </button>
        ))}
      </div>

      <ul className="tx-list">
        {sorted.length === 0 && <li className="empty-text">データがありません</li>}
        {sorted.map(tx => (
          <li key={tx.id} className="tx-item">
            <div className="tx-date">{tx.date}</div>
            <div className="tx-info">
              <span className="tx-category">{tx.category}</span>
              {tx.description && <span className="tx-desc">{tx.description}</span>}
            </div>
            <span className={`tx-amount ${tx.type}`}>
              {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}円
            </span>
            <button className="task-delete" onClick={() => deleteTransaction(tx.id)} aria-label="削除">✕</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
