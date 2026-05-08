import { useAppContext } from '../AppContext'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'ダッシュボード', icon: '📊' },
  { key: 'tasks', label: 'タスク管理', icon: '✅' },
  { key: 'accounting', label: '収支管理', icon: '💰' },
]

export default function Sidebar() {
  const { currentPage, setCurrentPage, summary } = useAppContext()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">MyApp</div>
        <div className="logo-sub">AIアドバイザー</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-summary">
        <div className="summary-label">今月の収支</div>
        <div className={`summary-balance ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
          {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString()}円
        </div>
        <div className="summary-row">
          <span className="income-dot">▲</span>
          <span>{summary.totalIncome.toLocaleString()}円</span>
        </div>
        <div className="summary-row">
          <span className="expense-dot">▼</span>
          <span>{summary.totalExpense.toLocaleString()}円</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-label">タスク</div>
        <div className="task-progress">
          <div
            className="task-progress-bar"
            style={{ width: `${summary.totalTasks ? (summary.completedTasks / summary.totalTasks) * 100 : 0}%` }}
          />
        </div>
        <div className="summary-row">
          <span>{summary.completedTasks} / {summary.totalTasks} 完了</span>
        </div>
      </div>
    </aside>
  )
}
