import { useState } from 'react'
import { useAppContext } from '../AppContext'
import { useInsights } from '../hooks/useInsights'

const INSIGHT_META = {
  warning:    { label: '⚠️ 注意', colorClass: 'insight-warning' },
  positive:   { label: '✅ 好調', colorClass: 'insight-positive' },
  suggestion: { label: '💡 提案', colorClass: 'insight-suggestion' },
  prediction: { label: '📈 予測', colorClass: 'insight-prediction' },
}

const CATEGORIES = {
  income:  ['給与', '副収入', '賞与', '投資', 'その他収入'],
  expense: ['住居費', '食費', '交通費', '光熱費', '娯楽費', '医療費', '衣服費', 'その他'],
}

const today = new Date().toISOString().slice(0, 10)

function QuickAddForm() {
  const { addTransaction } = useAppContext()
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES.expense[0])
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today)
  const [done, setDone] = useState(false)

  const handleTypeChange = (t) => {
    setType(t)
    setCategory(CATEGORIES[t][0])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseInt(amount, 10)
    if (!num || num <= 0) return
    addTransaction({ type, amount: num, category, description: description.trim(), date })
    setAmount('')
    setDescription('')
    setDate(today)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <div className="quick-add-card">
      <h2 className="section-title">収支を追加</h2>
      <form onSubmit={handleSubmit}>
        <div className="type-toggle" style={{ marginBottom: 12 }}>
          <button type="button" className={`type-btn ${type === 'income' ? 'type-income' : ''}`} onClick={() => handleTypeChange('income')}>収入</button>
          <button type="button" className={`type-btn ${type === 'expense' ? 'type-expense' : ''}`} onClick={() => handleTypeChange('expense')}>支出</button>
        </div>
        <div className="quick-add-fields">
          <input
            className="tx-input"
            type="number"
            placeholder="金額（円）"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="1"
            required
          />
          <select className="tx-select" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            className="tx-input"
            type="text"
            placeholder="メモ（任意）"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <input
            className="tx-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <button className="btn-primary" type="submit" style={{ whiteSpace: 'nowrap' }}>
            {done ? '✓ 追加済み' : '追加'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function DashboardPage() {
  const { summary, tasks, transactions } = useAppContext()
  const { insights, briefing, loading, refresh } = useInsights(summary)

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const pendingTasks = tasks.filter(t => !t.completed)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">ダッシュボード</h1>
        <button className="btn-refresh" onClick={refresh} disabled={loading}>
          {loading ? 'AI分析中…' : 'AIを再分析'}
        </button>
      </div>

      {/* AI デイリーブリーフィング */}
      <div className="briefing-card">
        <div className="briefing-icon">🤖</div>
        <div className="briefing-content">
          <div className="briefing-title">AIデイリーブリーフィング</div>
          <p className="briefing-text">{briefing}</p>
        </div>
      </div>

      {/* サマリー統計 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">今月の収入</div>
          <div className="stat-value income">{summary.totalIncome.toLocaleString()}円</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">今月の支出</div>
          <div className="stat-value expense">{summary.totalExpense.toLocaleString()}円</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">収支残高</div>
          <div className={`stat-value ${summary.balance >= 0 ? 'income' : 'expense'}`}>
            {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString()}円
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">タスク完了率</div>
          <div className="stat-value neutral">
            {summary.totalTasks ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* インサイトカード 2×2 */}
      <h2 className="section-title">AIインサイト</h2>
      <div className="insights-grid">
        {insights.map((insight, i) => {
          const meta = INSIGHT_META[insight.type] || INSIGHT_META.prediction
          return (
            <div key={i} className={`insight-card ${meta.colorClass}`}>
              <div className="insight-label">{meta.label}</div>
              <p className="insight-text">{insight.content}</p>
            </div>
          )
        })}
      </div>

      {/* 収支追加フォーム */}
      <QuickAddForm />

      <div className="bottom-grid">
        {/* 未完了タスク */}
        <div className="bottom-card">
          <h2 className="section-title">未完了タスク</h2>
          {pendingTasks.length === 0 ? (
            <p className="empty-text">すべてのタスクが完了しています！</p>
          ) : (
            <ul className="quick-task-list">
              {pendingTasks.slice(0, 5).map(task => (
                <li key={task.id} className="quick-task-item">
                  <span className={`priority-badge priority-${task.priority}`}>
                    {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                  </span>
                  <span className="quick-task-title">{task.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 最近の収支 */}
        <div className="bottom-card">
          <h2 className="section-title">最近の収支</h2>
          <ul className="quick-tx-list">
            {recentTransactions.map(tx => (
              <li key={tx.id} className="quick-tx-item">
                <div className="quick-tx-info">
                  <span className="quick-tx-category">{tx.category}</span>
                  <span className="quick-tx-desc">{tx.description}</span>
                </div>
                <span className={`quick-tx-amount ${tx.type}`}>
                  {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}円
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
