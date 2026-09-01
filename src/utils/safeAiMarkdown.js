/**
 * 将不可信 AI 文本转换为应用使用的少量 Markdown 展示标签。
 *
 * 先完整转义原始文本，再添加由本函数生成的固定标签；不要在这里
 * 接受模型返回的任意 HTML，否则 v-html 会重新成为注入入口。
 */
export function renderSafeAiMarkdown(value) {
  if (value === null || value === undefined || value === '') return ''

  const codeBlocks = []
  let text = escapeHtml(String(value))

  // 先提取 fenced code，避免其中的 #、-、` 被后续规则当作 Markdown。
  text = text.replace(/```[A-Za-z0-9_-]*\n?([\s\S]*?)```/g, (_match, code) => {
    const token = `\u0000AI_CODE_${codeBlocks.length}\u0000`
    codeBlocks.push(`<pre class="ai-code-block"><code>${code.trim()}</code></pre>`)
    return token
  })

  text = text
    .replace(/`([^`\n]+)`/g, '<code class="ai-inline-code">$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<div class="ai-md-h3">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="ai-md-h2">$1</div>')
    .replace(/^# (.+)$/gm, '<div class="ai-md-h1">$1</div>')
    .replace(/^- (.+)$/gm, '<div class="ai-md-li">$1</div>')
    .replace(/\n/g, '<br>')

  return text.replace(/\u0000AI_CODE_(\d+)\u0000/g, (_match, index) => codeBlocks[Number(index)] || '')
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
