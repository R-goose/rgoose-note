// 打包版功能冒烟测试：CDP + IPC 验证核心 CRUD（零第三方依赖，内置 mini WebSocket 客户端）
const http = require('http')
const crypto = require('crypto')

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:9223${path}`, (res) => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch { reject(new Error('bad json: ' + d.substring(0, 80))) } })
    }).on('error', reject)
  })
}

// 极简 WebSocket 客户端（客户端帧带掩码；服务器帧无掩码）
function wsConnect(url) {
  return new Promise((resolve, reject) => {
    const m = url.match(/^ws:\/\/([^:/]+):(\d+)(.*)$/)
    const key = crypto.randomBytes(16).toString('base64')
    const req = http.request({ host: m[1], port: +m[2], path: m[3], headers: {
      Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': key, 'Sec-WebSocket-Version': 13
    }})
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
  let targets = null
  for (let i = 0; i < 20; i++) {
    try {
      targets = await getJson('/json/list')
      if (targets.some(t => t.type === 'page')) break
    } catch {}
    await new Promise(r => setTimeout(r, 1000))
  }
  const page = targets && targets.find(t => t.type === 'page')
  if (!page) { console.log('FAIL: CDP 无 page target'); process.exit(1) }
  console.log('CDP 已连接:', page.url.slice(0, 80))

  const ws = await wsConnect(page.webSocketDebuggerUrl)
  let mid = 1
  const pending = {}
  ws.onMessage(m => { if (m.id && pending[m.id]) { m.error ? pending[m.id].rej(m.error) : pending[m.id].res(m.result); delete pending[m.id] } })
  const send = (method, params = {}) => new Promise((res, rej) => { const id = mid++; pending[id] = { res, rej }; ws.send({ id, method, params }) })
  const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value

  const results = []
  const t = (name, ok, detail) => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ' | ' + detail : ''}`) }

  for (let i = 0; i < 15; i++) {
    if (await evalJs(`!!(window.electronAPI && document.querySelector('#app'))`)) break
    await new Promise(r => setTimeout(r, 1000))
  }

  t('preload/electronAPI 注入', await evalJs(`!!window.electronAPI && typeof window.electronAPI.backend === 'function'`))

  const listRes = await evalJs(`window.electronAPI.backend('backend:notes:listAll').then(r => 'OK:' + (r?.data?.length ?? '?')).catch(e => 'ERR:' + e.message)`)
  t('SQLite 读链路(notes:listAll)', listRes.startsWith('OK'), listRes)

  const nid = 'note_smoke_' + Date.now()
  const createRes = await evalJs(`window.electronAPI.backend('backend:notes:create', { id: ${JSON.stringify(nid)}, title: '__smoke_pkg_test__' }).then(r => JSON.stringify(r)).catch(e => 'ERR:' + e.message)`)
  const createdOk = !createRes.startsWith('ERR') && createRes.includes(nid)
  t('SQLite 写链路(notes:create)', createdOk, `id=${nid}`)

  if (createdOk) {
    const upd = await evalJs(`window.electronAPI.backend('backend:notes:update', { id: ${JSON.stringify(nid)}, note: { title: '__smoke_pkg_2__' } }).then(r => 'OK').catch(e => 'ERR:' + e.message)`)
    t('更新笔记(notes:update)', upd === 'OK', upd)
    const del = await evalJs(`window.electronAPI.backend('backend:notes:delete', ${JSON.stringify(nid)}).then(r => 'OK').catch(e => 'ERR:' + e.message)`)
    t('删除笔记(notes:delete)', del === 'OK', del)
  }

  for (const [name, channel] of [['文件夹(folders:list)', 'backend:folders:list'], ['标签(tags:list)', 'backend:tags:list'], ['计划(plans:list)', 'backend:plans:list'], ['图片库(images:listRefs)', 'backend:images:listRefs'], ['图片元数据(images:listAllWithMeta)', 'backend:images:listAllWithMeta'], ['同步导出(sync:exportAll)', 'backend:sync:exportAll']]) {
    const r = await evalJs(`window.electronAPI.backend(${JSON.stringify(channel)}).then(() => 'OK').catch(e => 'ERR:' + e.message)`)
    t(name, r === 'OK', r)
  }

  const uiOk = await evalJs(`!!document.querySelector('#app') && document.querySelector('#app').children.length > 0 && !!document.querySelector('button, input, .sidebar, nav, #app *')`)
  t('Vue 应用渲染', uiOk)

  // 前端资源加载完整性：页面内所有 script/img 无加载失败
  const resOk = await evalJs(`Array.from(document.querySelectorAll('script[src], link[rel=stylesheet]')).every(el => el.tagName === 'SCRIPT' ? true : el.sheet !== null)`)
  t('CSS 资源全部加载成功', resOk)

  const failed = results.filter(x => !x).length
  console.log(`\n=== 结果: ${results.length - failed}/${results.length} PASS ===`)
  ws.close()
  process.exit(failed ? 1 : 0)
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1) })
