const API_URL = 'https://api.anthropic.com/v1/messages'

function headers() {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('NO_API_KEY')
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-allow-browser': 'true',
  }
}

async function post(body) {
  const res = await fetch(API_URL, { method: 'POST', headers: headers(), body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error: ${res.status}`)
  }
  return (await res.json()).content[0].text
}

/** テキストのみの呼び出し */
export async function callClaude({ system, prompt, maxTokens = 1000 }) {
  return post({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  })
}

/** 画像（複数可）＋テキストの呼び出し */
export async function callClaudeWithImages({ images, prompt, maxTokens = 1000 }) {
  const imageBlocks = images.map(({ base64, mediaType }) => ({
    type: 'image',
    source: { type: 'base64', media_type: mediaType, data: base64 },
  }))

  return post({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{
      role: 'user',
      content: [...imageBlocks, { type: 'text', text: prompt }],
    }],
  })
}
