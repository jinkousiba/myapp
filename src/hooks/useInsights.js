import { useState, useEffect, useCallback } from 'react'
import { callClaude } from '../utils/claudeClient'

const MOCK_INSIGHTS = [
  {
    type: 'warning',
    title: '支出リスク',
    content: '今月の食費が先月比15%増加しています。月末まで予算超過のリスクがあります。',
  },
  {
    type: 'positive',
    title: '好調',
    content: 'タスク完了率が向上しています。このペースを維持すれば今週中に全タスクを処理できます。',
  },
  {
    type: 'suggestion',
    title: '提案',
    content: '娯楽費のサブスクリプションを見直すと月3,000円の節約になる可能性があります。',
  },
  {
    type: 'prediction',
    title: '予測',
    content: '現在のペースでは来月末の収支は+125,000円になる見通しです。',
  },
]

const MOCK_BRIEFING =
  '今日の財務状況は良好です。収支バランスは黒字で推移しており、未完了タスクが3件あります。食費の増加傾向に注意が必要ですが、全体的には安定した月になっています。'

async function fetchInsight(type, system, prompt) {
  try {
    const text = await callClaude({ system, prompt, maxTokens: 150 })
    return { type, content: text.trim() }
  } catch {
    return MOCK_INSIGHTS.find(i => i.type === type)
  }
}

export function useInsights(summary) {
  const [insights, setInsights] = useState(MOCK_INSIGHTS)
  const [briefing, setBriefing] = useState(MOCK_BRIEFING)
  const [loading, setLoading] = useState(false)

  const system = summary
    ? `あなたは個人財務・タスク管理アドバイザーです。
ユーザーデータ: 収入${summary.totalIncome.toLocaleString()}円 / 支出${summary.totalExpense.toLocaleString()}円 / 残高${summary.balance.toLocaleString()}円
タスク: 全${summary.totalTasks}件中${summary.completedTasks}件完了
日本語で簡潔に60文字以内で回答してください。`
    : ''

  const generate = useCallback(async () => {
    if (!summary) return
    setLoading(true)
    try {
      const [w, p, s, pr, b] = await Promise.all([
        fetchInsight('warning', system, '収支データから最も注意すべきリスクを1つ教えてください。'),
        fetchInsight('positive', system, '今月の良い傾向を1つ教えてください。'),
        fetchInsight('suggestion', system, 'すぐに実行できる改善アクションを1つ教えてください。'),
        fetchInsight('prediction', system, '現在のペースでの来月の収支予測を教えてください。'),
        callClaude({ system, prompt: 'ユーザーへの今日のデイリーブリーフィングを100文字以内で作成してください。', maxTokens: 200 })
          .catch(() => MOCK_BRIEFING),
      ])
      setInsights([w, p, s, pr])
      setBriefing(typeof b === 'string' ? b.trim() : MOCK_BRIEFING)
    } finally {
      setLoading(false)
    }
  }, [summary, system])

  useEffect(() => {
    generate()
  }, [])

  return { insights, briefing, loading, refresh: generate }
}
