import assert from 'node:assert/strict'
import { renderSafeAiMarkdown } from '../src/utils/safeAiMarkdown.js'

const hostile = '<img src=x onerror="window.electronAPI.backend(\'backend:sync:clearAll\')">\n<script>alert(1)</script>\n<a href="javascript:alert(1)">x</a>\n<svg onload="alert(1)"></svg>'
const hostileOutput = renderSafeAiMarkdown(hostile)
assert.match(hostileOutput, /&lt;img/)
assert.match(hostileOutput, /&lt;script&gt;/)
assert.match(hostileOutput, /javascript:alert\(1\)/)
assert.match(hostileOutput, /&lt;svg/)
assert.doesNotMatch(hostileOutput, /<(?:img|script|svg|a)\b|<[^>]+\son(?:error|load)\s*=/i)

const markdown = renderSafeAiMarkdown('# 标题\n- **重点**\n`const x = 1`\n```js\n# 不是标题\n```')
assert.match(markdown, /<div class="ai-md-h1">标题<\/div>/)
assert.match(markdown, /<div class="ai-md-li"><strong>重点<\/strong><\/div>/)
assert.match(markdown, /<code class="ai-inline-code">const x = 1<\/code>/)
assert.match(markdown, /<pre class="ai-code-block"><code># 不是标题<\/code><\/pre>/)

console.log('safe-ai-markdown: PASS')
