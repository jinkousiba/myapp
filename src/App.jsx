import { AppProvider, useAppContext } from './AppContext'
import Sidebar from './components/Sidebar'
import AIFeedPanel from './components/AIFeedPanel'
import DashboardPage from './pages/DashboardPage'
import TaskPage from './pages/TaskPage'
import AccountingPage from './pages/AccountingPage'
import './App.css'

function AppContent() {
  const { currentPage } = useAppContext()

  const pages = {
    dashboard: <DashboardPage />,
    tasks: <TaskPage />,
    accounting: <AccountingPage />,
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {pages[currentPage] ?? <DashboardPage />}
      </main>
      <AIFeedPanel />
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
