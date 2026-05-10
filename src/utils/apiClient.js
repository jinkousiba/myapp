const BASE_URL    = import.meta.env.VITE_API_BASE_URL
const API_SECRET  = import.meta.env.VITE_API_SECRET

export const isApiEnabled = !!BASE_URL && !!API_SECRET

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_SECRET}`,
    },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const apiClient = {
  getTasks:          ()       => request('/api/tasks'),
  createTask:        (task)   => request('/api/tasks',      { method: 'POST',   body: JSON.stringify(task) }),
  updateTask:        (id, d)  => request(`/api/tasks/${id}`, { method: 'PATCH',  body: JSON.stringify(d) }),
  deleteTask:        (id)     => request(`/api/tasks/${id}`, { method: 'DELETE' }),

  getTransactions:   ()       => request('/api/transactions'),
  createTransaction: (tx)     => request('/api/transactions',      { method: 'POST',   body: JSON.stringify(tx) }),
  deleteTransaction: (id)     => request(`/api/transactions/${id}`, { method: 'DELETE' }),
}
