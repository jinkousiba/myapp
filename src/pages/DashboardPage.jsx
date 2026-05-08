import { useAppContext } from '../AppContext'
import { useInsights } from '../hooks/useInsights'

const INSIGHT_META = {
  warning:    { label: '⚠️ 注意', colorClass: 'insight-warning' },
  positive:   { label: '✅ 好調', colorClass: 'insight-positive' },
  suggestion: { label: '💡 提案', colorClass: 'insight-suggestion' },
  prediction: { label: '📈 予測', colorClass: 'insight-prediction' },
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
