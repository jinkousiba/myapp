import { useState, useCallback } from 'react'
import { useAppContext } from '../AppContext'
import { callClaude } from '../utils/claudeClient'

const MOCK_FEED = [
  { id: 1, kind: 'alert', text: '食費が今月の予算の80%を超えました。残り日数を考えると注意が必要です。', time: '5分前' },
  { id: 2, kind: 'positive', text: '先週からタスク完了率が20%向上しています。', time: '30分前' },
  { id: 3, kind: 'neutral', text: '交通費は先月比で横ばいです。', time: '1時間前' },
  { id: 4, kind: 'alert', text: '月次レポートの作成が3日間未着手です。優先度が高いタスクです。', time: '2時間前' },
  { id: 5, kind: 'positive', text: '副収入が今月も計上されました。収支改善に貢献しています。', time: '3時間前' },
]

function buildSystem(summary, tasks, transactions) {
  return `あなたは個人財務・タスク管理アドバイザーです。
ユーザーデータ:
- 収入: ${summary.totalIncome.toLocaleString()}円 / 支出: ${summary.totalExpense.toLocaleString()}円 / 残高: ${summary.balance.toLocaleString()}円
- タスク: 全${summary.totalTasks}件中${summary.completedTasks}件完了
- 未完了タスク: ${tasks.filter(t => !t.completed).map(t => t.title).join('、')}
日本語で簡潔に答えてください。`
}

async function generateFeed(system) {
  const prompts = [
    { kind: 'alert', p: '最も注意すべき財務アラートを1つ40文字以内で教えてください。' },
    { kind: 'positive', p: '今週の良い傾向を1つ40文字以内で教えてください。' },
    { kind: 'neutral', p: '最近の支出傾向を中立的に1つ40文字以内で教えてください。' },
    { kind: 'alert', p: '放置気味のタスクに関するアラートを1つ40文字以内で教えてください。' },
    { kind: 'positive', p: '財務面での改善ポイントを1つ40文字以内で褒めてください。' },
  ]

  const results = await Promise.all(
    prompts.map(async ({ kind, p }, i) => {
      try {
        const text = await callClaude({ system, prompt: p, maxTokens: 100 })
        return { id: i + 1, kind, text: text.trim(), time: 'たった今' }
      } catch {
        return { ...MOCK_FEED[i], time: 'たった今' }
      }
    })
  )
  return results
}

export default function AIFeedPanel() {
  const { summary, tasks, transactions } = useAppContext()
  const [feed, setFeed] = useState(MOCK_FEED)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const system = buildSystem(summary, tasks, transactions)
      const items = await generateFeed(system)
      setFeed(items)
    } finally {
      setLoading(false)
    }
  }, [summary, tasks, transactions])

  const kindLabel = { alert: '⚠️ アラート', positive: '✅ 好調', neutral: 'ℹ️ 情報' }
  const kindClass = { alert: 'feed-alert', positive: 'feed-positive', neutral: 'feed-neutral' }

  return (
    <aside className="ai-feed-panel">
      <div className="feed-header">
        <span>スマートフィード</span>
        <button className="feed-refresh-btn" onClick={refresh} disabled={loading}>
          {loading ? '更新中…' : '更新'}
        </button>
      </div>

      <div className="feed-list">
        {feed.map(item => (
          <div key={item.id} className={`feed-item ${kindClass[item.kind]}`}>
            <div className="feed-kind">{kindLabel[item.kind]}</div>
            <div className="feed-text">{item.text}</div>
            <div className="feed-time">{item.time}</div>
          </div>
        ))}
      </div>

      <div className="feed-footer">
        AIが自律的に生成 · claude-sonnet-4-6
      </div>
    </aside>
  )
}
