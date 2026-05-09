import { useState } from 'react'
import { AppProvider, useAppContext } from './AppContext'
import Sidebar from './components/Sidebar'
import AIFeedPanel from './components/AIFeedPanel'
import DashboardPage from './pages/DashboardPage'
import TaskPage from './pages/TaskPage'
import AccountingPage from './pages/AccountingPage'
import './App.css'

function AppContent() {
  const { currentPage } = useAppContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [feedOpen, setFeedOpen] = useState(false)

  const pages = {
    dashboard: <DashboardPage />,
    tasks: <TaskPage />,
    accounting: <AccountingPage />,
  }

  return (
    <div className="app-layout">
      {/* モバイル用オーバーレイ背景 */}
      {(sidebarOpen || feedOpen) && (
        <div
          className="overlay"
          onClick={() => { setSidebarOpen(false); setFeedOpen(false) }}
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        {/* モバイルヘッダー */}
        <div className="mobile-header">
          <button className="hamburger" onClick={() => { setSidebarOpen(true); setFeedOpen(false) }}>
            ☰
          </button>
          <span className="mobile-logo">MyApp</span>
          <button className="feed-toggle-btn" onClick={() => { setFeedOpen(!feedOpen); setSidebarOpen(false) }}>
            🤖
          </button>
        </div>

        {pages[currentPage] ?? <DashboardPage />}
      </main>

      {/* デスクトップ：フィードパネル開閉ボタン */}
      <button
        className="feed-toggle-desktop"
        onClick={() => setFeedOpen(!feedOpen)}
        title={feedOpen ? 'フィードを閉じる' : 'スマートフィードを開く'}
      >
        {feedOpen ? '›' : '‹'}
      </button>

      <AIFeedPanel
        open={feedOpen}
        onClose={() => setFeedOpen(false)}
      />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
