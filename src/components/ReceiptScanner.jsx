import { useState, useRef, useCallback } from 'react'
import { useAppContext } from '../AppContext'
import { callClaudeWithImages } from '../utils/claudeClient'

const CATEGORIES = ['食費', '住居費', '交通費', '光熱費', '娯楽費', '医療費', '衣服費', 'その他']
const today = new Date().toISOString().slice(0, 10)

const RECEIPT_PROMPT = `このレシート・領収書の画像から情報を抽出してください。
以下のJSON形式のみで返答してください（マークダウン・説明文は不要）:
{
  "date": "YYYY-MM-DD（日付が読み取れない場合は${today}）",
  "amount": 合計金額の数値のみ,
  "category": "食費|住居費|交通費|光熱費|娯楽費|医療費|衣服費|その他 のいずれか",
  "description": "店名または内容（20文字以内）"
}`

/** File → base64 変換 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** 1枚のレシートを解析 */
async function parseReceipt(file) {
  const base64 = await fileToBase64(file)
  const mediaType = file.type || 'image/jpeg'
  const text = await callClaudeWithImages({
    images: [{ base64, mediaType }],
    prompt: RECEIPT_PROMPT,
    maxTokens: 300,
  })
  // JSON部分のみ抽出
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('解析結果が不正です')
  return JSON.parse(match[0])
}

/** 結果の編集カード */
function ResultCard({ item, index, onChange, onRemove }) {
  return (
    <div className={`receipt-result-card ${item.error ? 'result-error' : ''} ${item.checked ? '' : 'result-unchecked'}`}>
      <div className="receipt-result-header">
        <label className="receipt-checkbox">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={e => onChange(index, 'checked', e.target.checked)}
          />
          <span className="receipt-filename">{item.filename}</span>
        </label>
        <button className="task-delete" onClick={() => onRemove(index)}>✕</button>
      </div>

      {item.error ? (
        <div className="receipt-error-msg">⚠️ 読み取り失敗: {item.error}</div>
      ) : (
        <div className="receipt-fields">
          <div className="receipt-field">
            <label>金額（円）</label>
            <input
              type="number"
              value={item.amount}
              onChange={e => onChange(index, 'amount', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="receipt-field">
            <label>カテゴリ</label>
            <select value={item.category} onChange={e => onChange(index, 'category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="receipt-field">
            <label>日付</label>
            <input
              type="date"
              value={item.date}
              onChange={e => onChange(index, 'date', e.target.value)}
            />
          </div>
          <div className="receipt-field receipt-field-wide">
            <label>メモ</label>
            <input
              type="text"
              value={item.description}
              onChange={e => onChange(index, 'description', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReceiptScanner() {
  const { addTransaction } = useAppContext()
  const [files, setFiles] = useState([])       // アップロード済みFile[]
  const [previews, setPreviews] = useState([]) // ObjectURL[]
  const [results, setResults] = useState([])   // 解析結果
  const [scanning, setScanning] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [added, setAdded] = useState(false)
  const inputRef = useRef()

  const addFiles = useCallback((newFiles) => {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setFiles(prev => [...prev, ...arr])
    setPreviews(prev => [...prev, ...arr.map(f => URL.createObjectURL(f))])
    setResults([])
    setAdded(false)
  }, [])

  const removeFile = (i) => {
    URL.revokeObjectURL(previews[i])
    setFiles(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
    setResults([])
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const handleScan = async () => {
    if (!files.length) return
    setScanning(true)
    setResults([])
    const items = await Promise.all(
      files.map(async (file, i) => {
        try {
          const data = await parseReceipt(file)
          return {
            filename: file.name,
            checked: true,
            amount: data.amount || 0,
            category: CATEGORIES.includes(data.category) ? data.category : 'その他',
            date: data.date || today,
            description: data.description || '',
            preview: previews[i],
          }
        } catch (e) {
          return { filename: file.name, checked: false, error: e.message, preview: previews[i] }
        }
      })
    )
    setResults(items)
    setScanning(false)
  }

  const handleChange = (index, key, value) => {
    setResults(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item))
  }

  const handleRemoveResult = (index) => {
    setResults(prev => prev.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    const toAdd = results.filter(r => r.checked && !r.error)
    toAdd.forEach(r => addTransaction({
      type: 'expense',
      amount: r.amount,
      category: r.category,
      description: r.description,
      date: r.date,
    }))
    setFiles([]); setPreviews([]); setResults([])
    setAdded(true)
    setTimeout(() => setAdded(false), 3000)
  }

  const checkedCount = results.filter(r => r.checked && !r.error).length

  return (
    <div className="receipt-scanner-card">
      <h2 className="section-title">📷 レシート読み込み</h2>

      {/* ドロップゾーン */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''} ${files.length ? 'has-files' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
        {files.length === 0 ? (
          <>
            <div className="drop-icon">🧾</div>
            <div className="drop-text">レシートをドラッグ＆ドロップ</div>
            <div className="drop-sub">または タップして選択（複数可）</div>
          </>
        ) : (
          <div className="preview-grid" onClick={e => e.stopPropagation()}>
            {previews.map((url, i) => (
              <div key={i} className="preview-item">
                <img src={url} alt={files[i]?.name} />
                <button className="preview-remove" onClick={() => removeFile(i)}>✕</button>
              </div>
            ))}
            <div className="preview-add" onClick={() => inputRef.current.click()}>
              <span>＋</span>
              <span>追加</span>
            </div>
          </div>
        )}
      </div>

      {/* スキャンボタン */}
      {files.length > 0 && results.length === 0 && (
        <button
          className="btn-scan"
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning
            ? `🔍 読み取り中… (${files.length}枚)`
            : `🔍 ${files.length}枚のレシートを読み取る`}
        </button>
      )}

      {/* 読み取り中プログレス */}
      {scanning && (
        <div className="scan-progress">
          <div className="scan-bar" />
        </div>
      )}

      {/* 解析結果 */}
      {results.length > 0 && (
        <>
          <div className="results-header">
            <span className="results-label">読み取り結果（編集できます）</span>
            <span className="results-count">{checkedCount}件を追加予定</span>
          </div>
          <div className="receipt-results">
            {results.map((item, i) => (
              <ResultCard
                key={i}
                item={item}
                index={i}
                onChange={handleChange}
                onRemove={handleRemoveResult}
              />
            ))}
          </div>
          <button
            className="btn-add-all"
            onClick={handleAdd}
            disabled={checkedCount === 0}
          >
            ✓ {checkedCount}件を収支に追加
          </button>
        </>
      )}

      {added && <div className="scan-success">✅ 収支に追加しました！</div>}
    </div>
  )
}
