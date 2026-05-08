import React, { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

const initialTasks = []

const initialTransactions = []

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [currentPage, setCurrentPage] = useState('dashboard')

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const summary = {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    completedTasks: tasks.filter(t => t.completed).length,
    totalTasks: tasks.length,
  }

  const addTask = (task) =>
    setTasks(prev => [...prev, { ...task, id: Date.now(), createdAt: new Date().toISOString() }])
  const toggleTask = (id) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  const deleteTask = (id) =>
    setTasks(prev => prev.filter(t => t.id !== id))

  const addTransaction = (tx) =>
    setTransactions(prev => [...prev, { ...tx, id: Date.now() }])
  const deleteTransaction = (id) =>
    setTransactions(prev => prev.filter(t => t.id !== id))

  return (
    <AppContext.Provider value={{
      tasks, transactions, summary, currentPage, setCurrentPage,
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
