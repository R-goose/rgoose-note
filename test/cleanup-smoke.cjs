// 通过打包版 IPC 清理测试残留笔记
const http = require('http')
const crypto = require('crypto')

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:9223${path}`, (res) => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch { reject(new Error('bad json')) } })
    }).on('error', reject)
  })
}

function wsConnect(url) {
  return new Promise((resolve, reject) => {
    const m = url.match(/^ws:\/\/([^:/]+):(\d+)(.*)$/)
    const key = crypto.randomBytes(16).toString('base64')
    const req = http.request({ host: m[1], port: +m[2], path: m[3], headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': key, 'Sec-WebSocket-Version': 13 } })
    req.on('upgrade', (res, socket) => {
      const send = (obj) => {
        const payload = Buffer.from(JSON.stringify(obj))
        const mask = crypto.randomBytes(4)
        let header
        if (payload.length < 126) { header = Buffer.alloc(2); header[1] = 0x80 | payload.length }
        else { header = Buffer.alloc(4); header[1] = 0x80 | 126; header.writeUInt16BE(payload.length, 2) }
        header[0] = 0x81
        const masked = Buffer.alloc(payload.length)
        for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i & 3]
        socket.write(Buffer.concat([header, mask, masked]))
      }
      const listeners = []
      let buf = Buffer.alloc(0)
      socket.on('data', chunk => {
        buf = Buffer.concat([buf, chunk])
        while (true) {
          if (buf.length < 2) break
          const len1 = buf[1] & 0x7f
          let off = 2, len = len1
          if (len1 === 126) { if (buf.length < 4) break; len = buf.readUInt16BE(2); off = 4 }
          else if (len1 === 127) { if (buf.length < 10) break; len = Number(buf.readBigUInt64BE(2)); off = 10 }
          if (buf.length < off + len) break
          const text = buf.slice(off, off + len).toString('utf8')
          buf = buf.slice(off + len)
          let msg = null
          try { msg = JSON.parse(text) } catch {}
          if (msg) listeners.forEach(l => l(msg))
        }
      })
      resolve({ send, onMessage: fn => listeners.push(fn), close: () => socket.destroy() })
    })
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  const targets = await getJson('/json/list')
  const page = targets.find(t => t.type === 'page')
  if (!page) { console.log('FAIL: 打包版未运行'); process.exit(1) }
  const ws = await wsConnect(page.webSocketDebuggerUrl)
  let mid = 1
  const pending = {}
  ws.onMessage(m => { if (m.id && pending[m.id]) { m.error ? pending[m.id].rej(m.error) : pending[m.id].res(m.result); delete pending[m.id] } })
  const send = (method, params = {}) => new Promise((res, rej) => { const id = mid++; pending[id] = { res, rej }; ws.send({ id, method, params }) })
  const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value

  const r = await evalJs(`(async () => {
    const all = (await window.electronAPI.backend('backend:notes:listAll')).data || []
    const smoke = all.filter(n => (n.title || '').startsWith('__smoke'))
    for (const n of smoke) await window.electronAPI.backend('backend:notes:delete', n.id)
    return '已清理: ' + smoke.length + ' 条 (' + smoke.map(n => n.title).join(', ') + ')'
  })()`)
  console.log(r)
  ws.close()
}
main().catch(e => { console.error('FATAL', e.message); process.exit(1) })
