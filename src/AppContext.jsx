import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient, isApiEnabled } from './utils/apiClient'

const AppContext = createContext(null)

// ── localStorage ヘルパー ────────────────────────
function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}
function saveLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ── サーバーへ同期（失敗しても画面には影響しない） ──
function syncToServer(fn) {
  if (!isApiEnabled) return
  fn().catch(() => {})
}

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState(() => loadLocal('myapp_tasks', []))
  const [transactions, setTransactions] = useState(() => loadLocal('myapp_transactions', []))
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [serverReady, setServerReady] = useState(!isApiEnabled)

  // ── 起動時にサーバーからデータ取得 ──────────────
  useEffect(() => {
    if (!isApiEnabled) return
    Promise.all([apiClient.getTasks(), apiClient.getTransactions()])
      .then(([t, tx]) => {
        setTasks(t);        saveLocal('myapp_tasks', t)
        setTransactions(tx); saveLocal('myapp_transactions', tx)
      })
      .catch(() => {
        // サーバー未起動時はlocalStorageのデータをそのまま使う
        console.warn('サーバーに接続できません。ローカルデータを使用します。')
      })
      .finally(() => setServerReady(true))
  }, [])

  // ── サマリー計算 ──────────────────────────────
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const summary = {
    totalIncome, totalExpense,
    balance: totalIncome - totalExpense,
    completedTasks: tasks.filter(t => t.completed).length,
    totalTasks: tasks.length,
  }

  // ── タスク操作 ───────────────────────────────
  const addTask = (task) => {
    const newTask = { ...task, id: Date.now(), createdAt: new Date().toISOString() }
    setTasks(prev => { const next = [...prev, newTask]; saveLocal('myapp_tasks', next); return next })
    syncToServer(() => apiClient.createTask(newTask))
  }

  const toggleTask = (id) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      saveLocal('myapp_tasks', next)
      const updated = next.find(t => t.id === id)
      syncToServer(() => apiClient.updateTask(id, { completed: updated.completed }))
      return next
    })
  }

  const deleteTask = (id) => {
    setTasks(prev => { const next = prev.filter(t => t.id !== id); saveLocal('myapp_tasks', next); return next })
    syncToServer(() => apiClient.deleteTask(id))
  }

  // ── 収支操作 ─────────────────────────────────
  const addTransaction = (tx) => {
    const newTx = { ...tx, id: Date.now() }
    setTransactions(prev => { const next = [...prev, newTx]; saveLocal('myapp_transactions', next); return next })
    syncToServer(() => apiClient.createTransaction(newTx))
  }

  const deleteTransaction = (id) => {
    setTransactions(prev => { const next = prev.filter(t => t.id !== id); saveLocal('myapp_transactions', next); return next })
    syncToServer(() => apiClient.deleteTransaction(id))
  }

  return (
    <AppContext.Provider value={{
      tasks, transactions, summary, currentPage, setCurrentPage, serverReady,
      addTask, toggleTask, deleteTask, addTransaction, deleteTransaction,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
