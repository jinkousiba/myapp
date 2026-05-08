import { useState } from 'react'
import { useAppContext } from '../AppContext'

const PRIORITIES = [
  { value: 'high', label: '高', className: 'priority-high' },
  { value: 'medium', label: '中', className: 'priority-medium' },
  { value: 'low', label: '低', className: 'priority-low' },
]

export default function TaskPage() {
  const { tasks, addTask, toggleTask, deleteTask } = useAppContext()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask({ title: title.trim(), priority, completed: false })
    setTitle('')
    setPriority('medium')
  }

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'done') return t.completed
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return order[a.priority] - order[b.priority]
  })

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">タスク管理</h1>
        <div className="task-stats">
          {tasks.filter(t => t.completed).length} / {tasks.length} 完了
        </div>
      </div>

      {/* 追加フォーム */}
      <form className="task-form" onSubmit={handleSubmit}>
        <input
          className="task-input"
          type="text"
          placeholder="新しいタスクを入力…"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <select
          className="priority-select"
          value={priority}
          onChange={e => setPriority(e.target.value)}
        >
          {PRIORITIES.map(p => (
            <option key={p.value} value={p.value}>優先度: {p.label}</option>
          ))}
        </select>
        <button className="btn-primary" type="submit">追加</button>
      </form>

      {/* フィルター */}
      <div className="filter-tabs">
        {[['all', 'すべて'], ['active', '未完了'], ['done', '完了済み']].map(([v, l]) => (
          <button
            key={v}
            className={`filter-tab ${filter === v ? 'active' : ''}`}
            onClick={() => setFilter(v)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* タスクリスト */}
      <ul className="task-list">
        {sorted.length === 0 && (
          <li className="empty-text">タスクがありません</li>
        )}
        {sorted.map(task => (
          <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
            <button
              className={`task-check ${task.completed ? 'checked' : ''}`}
              onClick={() => toggleTask(task.id)}
              aria-label="完了トグル"
            >
              {task.completed ? '✓' : ''}
            </button>
            <div className="task-body">
              <span className={`task-title ${task.completed ? 'done' : ''}`}>{task.title}</span>
              <span className={`priority-badge priority-${task.priority}`}>
                {PRIORITIES.find(p => p.value === task.priority)?.label}
              </span>
            </div>
            <button
              className="task-delete"
              onClick={() => deleteTask(task.id)}
              aria-label="削除"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
