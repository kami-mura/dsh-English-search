// VocabFlow DSH 搜索栏插件 —— Client 半体
// 用法：作为 cordis_define 的 code.client 提交（完整函数体，直接粘贴）。
// 注册插槽：shell.overlay（id: vocabflow-search），顶部固定搜索栏 + 结果面板。
// 与 Host 通过 Package 私有 RPC 通信：host.call('lookup'|'quick'|'question', payload)。
return {
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
    const inlineMarkdown = (s) => {
      let out = escapeHtml(s)
      out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
      out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      return out
    }
    const richHtml = (text) => {
      const lines = String(text || '').split('\n')
      let html = ''
      let listTag = ''
      const closeList = () => { if (listTag) { html += '</' + listTag + '>'; listTag = '' } }
      for (const raw of lines) {
        const line = raw.trim()
        if (/^[-*•]\s+/.test(line)) {
          if (listTag !== 'ul') { closeList(); html += '<ul>'; listTag = 'ul' }
          html += '<li>' + inlineMarkdown(line.replace(/^[-*•]\s+/, '')) + '</li>'
          continue
        }
        if (/^\d+[.)]\s+/.test(line)) {
          if (listTag !== 'ol') { closeList(); html += '<ol>'; listTag = 'ol' }
          html += '<li>' + inlineMarkdown(line.replace(/^\d+[.)]\s+/, '')) + '</li>'
          continue
        }
        closeList()
        if (/^###\s+/.test(line)) { html += '<h4>' + inlineMarkdown(line.replace(/^###\s+/, '')) + '</h4>'; continue }
        if (/^##\s+/.test(line)) { html += '<h3>' + inlineMarkdown(line.replace(/^##\s+/, '')) + '</h3>'; continue }
        if (/^#\s+/.test(line)) { html += '<h2>' + inlineMarkdown(line.replace(/^#\s+/, '')) + '</h2>'; continue }
        if (/^>\s+/.test(line)) { html += '<blockquote>' + inlineMarkdown(line.replace(/^>\s+/, '')) + '</blockquote>'; continue }
        html += line ? '<p>' + inlineMarkdown(line) + '</p>' : ''
      }
      closeList()
      return html
    }

    const PLACEHOLDERS = {
      lookup: '输入单词，短语或者简短中文',
      etymology: '输入英文单词，查词源，如 arena',
      qa: '输入英语问题，如 lie 和 lay 的区别',
    }

    function SearchBar() {
      const [mode, setMode] = React.useState('lookup')
      const [text, setText] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [result, setResult] = React.useState(null)
      let inputEl = null
      const setInputRef = (el) => { inputEl = el }

      const doSearch = async () => {
        const raw = text.trim()
        if (!raw || busy) return
        let m = mode
        let q = raw
        const quickPrefix = raw.startsWith('!') || raw.startsWith('！')
        const qaPrefix = raw.startsWith('?') || raw.startsWith('？')
        if (quickPrefix && raw.length > 1) { m = 'quick'; q = raw.slice(1).trim() }
        else if (qaPrefix && raw.length > 1) { m = 'qa'; q = raw.slice(1).trim() }
        else if (m === 'etymology') { m = 'quick' }
        else if (m === 'qa') { m = 'qa' }
        if (!q) {
          setResult({ error: m === 'qa' ? '请输入要问的英语问题' : '请输入要查询的单词' })
          return
        }
        setBusy(true)
        setResult(null)
        try {
          const method = m === 'qa' ? 'question' : m === 'quick' ? 'quick' : 'lookup'
          const payload = m === 'qa' ? { question: q } : { text: q }
          const res = await host.call(method, payload)
          setResult(res && res.text ? { text: res.text } : { error: (res && res.error) || '查询失败' })
        } catch (err) {
          setResult({ error: '查询服务不可用' })
        } finally {
          setBusy(false)
        }
      }
      const clear = () => { setResult(null); setText(''); if (inputEl) inputEl.focus() }
      const pickMode = (id) => { setMode(id); if (inputEl) inputEl.focus() }
      const showPanel = busy || result !== null

      return React.createElement(
        'div',
        { className: 'vf-search' },
        React.createElement(
          'div',
          { className: 'vf-topbar' },
          React.createElement(
            'div',
            { className: 'vf-form' },
            React.createElement(
              'div',
              { className: 'vf-mode', role: 'group', 'aria-label': '查询模式' },
              ['lookup', 'etymology', 'qa'].map((id) => React.createElement(
                'button',
                {
                  key: id,
                  type: 'button',
                  className: 'vf-mode-btn' + (mode === id ? ' vf-active' : ''),
                  'aria-pressed': mode === id,
                  onClick: () => pickMode(id),
                },
                id === 'lookup' ? '查词' : id === 'etymology' ? '词源' : '问答',
              )),
            ),
            React.createElement(
              'div',
              { className: 'vf-capsule' },
              React.createElement('input', {
                ref: setInputRef,
                type: 'text',
                value: text,
                placeholder: PLACEHOLDERS[mode] || PLACEHOLDERS.lookup,
                'aria-label': '搜索单词',
                onChange: (e) => setText(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === 'Enter') doSearch()
                  if (e.key === 'Escape') clear()
                },
              }),
              text
                ? React.createElement('button', { className: 'vf-clear', type: 'button', 'aria-label': '清空搜索', onClick: () => setText('') }, '×')
                : null,
            ),
            React.createElement('button', { className: 'vf-go', type: 'button', onClick: doSearch, disabled: busy || !text.trim() }, busy ? '查询中' : 'DeepSeek'),
          ),
        ),
        showPanel
          ? React.createElement(
              'div',
              { className: 'vf-panel' },
              React.createElement('button', { className: 'vf-close', type: 'button', 'aria-label': '关闭结果', onClick: clear }, '×'),
              busy && !result
                ? React.createElement('div', { className: 'vf-panel-loading' }, '查询中…')
                : null,
              result && result.error
                ? React.createElement('div', { className: 'vf-panel-error' }, result.error)
                : null,
              result && result.text
                ? React.createElement('div', { className: 'vf-rich', dangerouslySetInnerHTML: { __html: richHtml(result.text) } })
                : null,
            )
          : null,
      )
    }

    styles.insert(
      '.vf-search{--vf-bg:#f7f9fd;--vf-panel:#ffffff;--vf-panel-2:#f5f7fc;--vf-text:#152033;--vf-muted:#6b7a90;--vf-line:#e2e8f2;--vf-accent:#007AFF;--vf-accent-2:#0A84FF;--vf-unknown:#e84545;--vf-shadow:0 1px 2px rgba(22,40,72,.04),0 8px 28px rgba(22,40,72,.07);pointer-events:auto}' +
      '@media (prefers-color-scheme:dark){.vf-search{--vf-bg:#0f1420;--vf-panel:#1a2130;--vf-panel-2:#222b3d;--vf-text:#e6ecf7;--vf-muted:#9aa7bc;--vf-line:#2c3850;--vf-accent:#0A84FF;--vf-accent-2:#409CFF;--vf-unknown:#ef5d5d;--vf-shadow:0 1px 2px rgba(0,0,0,.35),0 8px 28px rgba(0,0,0,.35)}}' +
      '.vf-topbar{position:fixed;top:0;left:0;right:0;z-index:9000;background:var(--vf-bg);border-bottom:1px solid var(--vf-line);padding:8px 12px}' +
      '.vf-form{display:flex;align-items:center;gap:10px;max-width:720px;margin:0 auto}' +
      '.vf-mode{display:flex;align-items:center;gap:4px;flex:none;padding:4px;border:1px solid var(--vf-line);border-radius:999px;background:var(--vf-panel)}' +
      '.vf-mode-btn{border:none;background:transparent;color:var(--vf-muted);font-size:14px;font-weight:600;padding:6px 12px;border-radius:999px;cursor:pointer;box-shadow:none}' +
      '.vf-mode-btn:hover{color:var(--vf-text)}' +
      '.vf-mode-btn.vf-active{background:var(--vf-accent);color:var(--vf-bg)}' +
      '.vf-capsule{flex:1;min-width:0;display:flex;align-items:center;gap:4px;padding:4px 6px 4px 12px;background:var(--vf-panel);border:1px solid var(--vf-line);border-radius:999px}' +
      '.vf-capsule:focus-within{border-color:var(--vf-accent);box-shadow:0 0 0 3px rgba(0,0,0,.08)}' +
      '.vf-capsule input{flex:1;min-width:0;padding:10px 0;font-size:16px;border:none;background:transparent;box-shadow:none;outline:none;color:var(--vf-text)}' +
      '.vf-capsule input::placeholder{color:var(--vf-muted)}' +
      '.vf-clear{display:inline-flex;align-items:center;justify-content:center;flex:none;width:30px;height:30px;padding:0;border-radius:50%;background:var(--vf-panel-2);color:var(--vf-muted);border:1px solid var(--vf-line);font-size:16px;line-height:1;cursor:pointer}' +
      '.vf-clear:hover{color:var(--vf-text)}' +
      '.vf-go{border-radius:999px;padding:13px 24px;font-size:16px;flex:none;border:1px solid var(--vf-accent);background:linear-gradient(135deg,var(--vf-accent) 0%,var(--vf-accent-2) 100%),linear-gradient(115deg,transparent 30%,rgba(255,255,255,.26) 50%,transparent 70%);background-size:100% 100%,220% 100%;background-position:0 0,130% 0;color:#fff;cursor:pointer}' +
      '.vf-go:hover,.vf-go:active{background:#0a66de;border-color:#0a66de;color:#fff}' +
      '@media (prefers-color-scheme:dark){.vf-go{background:linear-gradient(135deg,var(--vf-accent) 0%,var(--vf-accent-2) 100%);border-color:var(--vf-accent);color:#fff}.vf-go:hover,.vf-go:active{background:#2f86f0;border-color:#2f86f0;color:#fff}}' +
      '.vf-go:disabled{opacity:.65;cursor:default}' +
      '.vf-panel{position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:9001;width:min(720px,calc(100% - 24px));max-height:60vh;overflow:auto;padding:16px 20px;padding-right:44px;border-radius:16px;background:var(--vf-panel);border:1px solid var(--vf-line);box-shadow:var(--vf-shadow);color:var(--vf-text);font-size:15px;line-height:1.8;text-align:left}' +
      '.vf-panel-loading{color:var(--vf-muted)}' +
      '.vf-panel-error{color:var(--vf-unknown)}' +
      '.vf-close{position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border-radius:50%;background:var(--vf-panel-2);color:var(--vf-muted);border:1px solid var(--vf-line);font-size:15px;line-height:1;cursor:pointer}' +
      '.vf-close:hover{color:var(--vf-text)}' +
      '.vf-rich p{margin:0 0 8px}' +
      '.vf-rich ul,.vf-rich ol{margin:4px 0 10px;padding-left:22px}' +
      '.vf-rich h2,.vf-rich h3,.vf-rich h4{margin:12px 0 6px;line-height:1.4}' +
      '.vf-rich blockquote{margin:8px 0;padding:2px 12px;border-left:3px solid var(--vf-accent);color:var(--vf-muted)}' +
      '.vf-rich code{background:var(--vf-panel-2);border:1px solid var(--vf-line);border-radius:4px;padding:1px 5px;font-size:13px}' +
      '.vf-rich strong{color:var(--vf-text)}',
    )

    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'vocabflow-search' },
      () => React.createElement(SearchBar),
    ))
  },
}
