// VocabFlow DSH 搜索栏插件 —— Client 半体（动态安装版）
// 用法：作为 cordis_define 的 code.client 提交（完整函数体，直接粘贴）。
// v0.3.0 —— 与 lib/client.js 同一套 UI（复刻 vocabtool 搜索框），注册进
// conversation.top 插槽（聊天框最上面常驻，无会话时也显示，原头部保留在其下）。
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

    const MODES = [
      ['lookup', '查词'],
      ['etymology', '词源'],
      ['qa', '问答'],
    ]

    function SearchBar() {
      const [mode, setMode] = React.useState('lookup')
      const [text, setText] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [result, setResult] = React.useState(null)
      let inputEl = null
      const setInputRef = (el) => { inputEl = el }

      const runSearch = async (raw) => {
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
          setResult({ error: m === 'qa'
            ? '请在 ? 后面输入问题，如：?lie 和 lay 的区别'
            : '请在 ! 后面输入单词，如：!arena' })
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
      const doSearch = () => runSearch(text.trim())
      const clear = () => { setResult(null); setText(''); if (inputEl) inputEl.focus() }
      const pickMode = (id) => { setMode(id); if (inputEl) inputEl.focus() }
      const onInputDoubleClick = () => {
        if (!inputEl || inputEl.selectionStart == null) return
        const selected = inputEl.value
          .substring(inputEl.selectionStart, inputEl.selectionEnd)
          .replace(/\s+/g, ' ')
          .trim()
        if (selected && selected.length <= 200) {
          setText(selected)
          runSearch(selected)
        }
      }
      const showPanel = busy || result !== null
      let panelClass = 'landing-search-result'
      if (busy && !result) panelClass += ' loading'
      if (result && result.error) panelClass += ' error'

      return React.createElement(
        'div',
        { className: 'es-root' },
        React.createElement(
          'form',
          { className: 'landing-search', onSubmit: (e) => { e.preventDefault(); doSearch() } },
          React.createElement(
            'div',
            { className: 'search-mode', role: 'group', 'aria-label': '查询模式' },
            MODES.map(([id, label]) => {
              const active = mode === id
              return React.createElement('button', {
                key: id,
                type: 'button',
                className: 'search-mode-btn' + (active ? ' active' : ''),
                'data-search-mode': id,
                'aria-pressed': active ? 'true' : 'false',
                onClick: () => pickMode(id),
              }, label)
            }),
          ),
          React.createElement(
            'div',
            { className: 'landing-search-input' },
            React.createElement('input', {
              ref: setInputRef,
              type: 'text',
              name: 'q',
              value: text,
              'aria-label': '搜索单词',
              onChange: (e) => setText(e.target.value),
              onKeyDown: (e) => {
                if (e.key === 'Enter') doSearch()
                if (e.key === 'Escape') clear()
              },
              onDoubleClick: onInputDoubleClick,
            }),
            text
              ? React.createElement('button', { className: 'landing-clear-btn', type: 'button', 'aria-label': '清空搜索', onClick: () => setText('') }, '×')
              : null,
          ),
          React.createElement('button', { className: 'primary', type: 'submit' }, '查询'),
        ),
        showPanel
          ? React.createElement(
              'div',
              { className: panelClass, role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', 'aria-busy': busy ? 'true' : 'false' },
              React.createElement('button', { className: 'search-result-close', type: 'button', 'aria-label': '关闭搜索结果', onClick: clear }, '×'),
              busy && !result
                ? React.createElement('div', { className: 'es-panel-loading' }, '查询中…')
                : null,
              result && result.error
                ? React.createElement('div', { className: 'es-panel-error' }, result.error)
                : null,
              result && result.text
                ? React.createElement('div', { className: 'es-rich', dangerouslySetInnerHTML: { __html: richHtml(result.text) } })
                : null,
            )
          : null,
      )
    }

    styles.insert(
      '.es-root{--es-bg:#f7f9fd;--es-panel:#ffffff;--es-panel-2:#f5f7fc;--es-text:#152033;--es-muted:#6b7a90;--es-line:#e2e8f2;--es-accent:#4176e6;--es-accent-2:#679efe;--es-logo-2:#679efe;--es-primary:var(--es-accent);--es-unknown:#e84545;--es-shadow:0 1px 2px rgba(22,40,72,.04),0 8px 28px rgba(22,40,72,.07);--es-shadow-lg:0 12px 40px rgba(28,48,88,.12);--es-lookup-border:rgba(65,118,230,.35);--es-ease:cubic-bezier(.2,.8,.2,1);position:relative;display:flex;flex-direction:column;align-items:center;width:100%;min-width:0;box-sizing:border-box;padding:12px 28px 0 20px;margin-bottom:-8px;color:var(--es-text);font-size:15px;line-height:1.8;text-align:left}' +
      'body[data-ds-dark-theme] .es-root{--es-bg:#0f1420;--es-panel:#1a2130;--es-panel-2:#222b3d;--es-text:#e6ecf7;--es-muted:#9aa7bc;--es-line:#2c3850;--es-accent:#679efe;--es-accent-2:#4176e6;--es-logo-2:#4176e6;--es-unknown:#ef5d5d;--es-shadow:0 1px 2px rgba(0,0,0,.35),0 8px 28px rgba(0,0,0,.35);--es-shadow-lg:0 12px 40px rgba(0,0,0,.5);--es-lookup-border:rgba(64,156,255,.4)}' +
      '@media (prefers-color-scheme:dark){.es-root{--es-bg:#0f1420;--es-panel:#1a2130;--es-panel-2:#222b3d;--es-text:#e6ecf7;--es-muted:#9aa7bc;--es-line:#2c3850;--es-accent:#679efe;--es-accent-2:#4176e6;--es-logo-2:#4176e6;--es-unknown:#ef5d5d;--es-shadow:0 1px 2px rgba(0,0,0,.35),0 8px 28px rgba(0,0,0,.35);--es-shadow-lg:0 12px 40px rgba(0,0,0,.5);--es-lookup-border:rgba(64,156,255,.4)}}' +
      '.es-root .landing-search{display:flex;align-items:center;gap:8px;max-width:560px;width:100%;margin:0 auto 2px;padding:4px;border:1px solid rgba(226,232,242,.9);border-radius:999px;background:rgba(255,255,255,.78);box-shadow:var(--es-shadow-lg),inset 0 1px 0 rgba(255,255,255,.8);backdrop-filter:blur(18px) saturate(1.3);-webkit-backdrop-filter:blur(18px) saturate(1.3);transition:border-color .25s ease,box-shadow .25s ease,transform .25s var(--es-ease);box-sizing:border-box}' +
      '.es-root .landing-search:focus-within{border-color:rgba(65,118,230,.45);box-shadow:var(--es-shadow-lg),0 0 0 4px rgba(65,118,230,.12);transform:translateY(-1px)}' +
      'body[data-ds-dark-theme] .es-root .landing-search{background:rgba(26,33,48,.82);border-color:rgba(44,56,80,.9)}' +
      '@media (prefers-color-scheme:dark){.es-root .landing-search{background:rgba(26,33,48,.82);border-color:rgba(44,56,80,.9)}}' +
      '.es-root .landing-search-input{flex:1;min-width:0;display:flex;align-items:center;gap:2px;padding:2px 4px 2px 10px;background:var(--es-panel);border:1px solid var(--es-line);border-radius:999px}' +
      '.es-root .landing-search-input:focus-within{border-color:var(--es-accent);box-shadow:0 0 0 3px rgba(0,0,0,.08)}' +
      '.es-root .landing-search input{flex:1;min-width:0;padding:7px 0;font-size:14px;border:none;background:transparent;box-shadow:none;outline:none;color:var(--es-text)}' +
      '.es-root .landing-search input::placeholder{color:var(--es-muted)}' +
      '.es-root .landing-search input:-webkit-autofill,.es-root .landing-search input:-webkit-autofill:hover,.es-root .landing-search input:-webkit-autofill:focus{background-color:var(--es-panel)!important;-webkit-box-shadow:0 0 0 1000px var(--es-panel) inset!important;-webkit-text-fill-color:var(--es-text)!important}' +
      '.es-root .landing-search .landing-clear-btn{display:inline-flex;align-items:center;justify-content:center;flex:none;width:22px;height:22px;padding:0;border-radius:50%;background:var(--es-panel-2);color:var(--es-muted);border:1px solid var(--es-line);font-size:13px;line-height:1;cursor:pointer}' +
      '.es-root .landing-search .landing-clear-btn{border-color:transparent;background:rgba(238,242,250,.85)}' +
      '.es-root .landing-search .landing-clear-btn:hover{background:rgba(65,118,230,.08);color:var(--es-text)}' +
      'body[data-ds-dark-theme] .es-root .landing-search .landing-clear-btn{background:rgba(44,56,80,.55)}' +
      '@media (prefers-color-scheme:dark){.es-root .landing-search .landing-clear-btn{background:rgba(44,56,80,.55)}}' +
      '.es-root .search-mode{display:flex;align-items:center;gap:2px;flex:none;padding:3px;border:1px solid var(--es-line);border-radius:999px;background:var(--es-panel)}' +
      '.es-root .search-mode .search-mode-btn{border:none;background:transparent;color:var(--es-muted);font-size:13px;font-weight:600;padding:4px 10px;border-radius:999px;cursor:pointer;box-shadow:none}' +
      '.es-root .search-mode .search-mode-btn:hover{color:var(--es-text)}' +
      '.es-root .search-mode .search-mode-btn.active{background:var(--es-primary);color:var(--es-bg)}' +
      '.es-root .landing-search button{border-radius:999px;padding:8px 16px;font-size:14px;flex:none;cursor:pointer}' +
      '.es-root .landing-search .primary{background:var(--es-accent);background-image:linear-gradient(135deg,var(--es-accent) 0%,var(--es-logo-2) 100%),linear-gradient(115deg,transparent 30%,rgba(255,255,255,.26) 50%,transparent 70%);background-size:100% 100%,220% 100%;background-position:0 0,130% 0;border:1px solid var(--es-accent);color:#ffffff;box-shadow:none}' +
      '.es-root .landing-search .primary:hover,.es-root .landing-search .primary:active{background:#4868b2;background-image:none;border-color:#4868b2;color:#ffffff;box-shadow:none}' +
      'body[data-ds-dark-theme] .es-root .landing-search .primary{background:var(--es-accent);background-image:linear-gradient(135deg,var(--es-accent) 0%,var(--es-accent-2) 100%);border-color:var(--es-accent);color:#ffffff}' +
      'body[data-ds-dark-theme] .es-root .landing-search .primary:hover,body[data-ds-dark-theme] .es-root .landing-search .primary:active{background:#4176e6;background-image:none;border-color:#4176e6;color:#ffffff}' +
      '@media (prefers-color-scheme:dark){.es-root .landing-search .primary{background:var(--es-accent);background-image:linear-gradient(135deg,var(--es-accent) 0%,var(--es-accent-2) 100%);border-color:var(--es-accent);color:#ffffff}.es-root .landing-search .primary:hover,.es-root .landing-search .primary:active{background:#4176e6;background-image:none;border-color:#4176e6;color:#ffffff}}' +
      '.es-root .landing-search-result{position:relative;width:min(640px,100%);max-width:640px;margin:0 auto 10px;padding:14px 18px;padding-right:40px;border-radius:16px;background:var(--es-panel);border:2px solid var(--es-lookup-border);box-shadow:var(--es-shadow);color:var(--es-text);font-size:14px;line-height:1.8;text-align:left;white-space:pre-wrap;max-height:55vh;overflow:auto;box-sizing:border-box}' +
      '.es-root .landing-search-result.loading{color:var(--es-muted)}' +
      '.es-root .landing-search-result.error{color:var(--es-unknown)}' +
      '.es-root .search-result-close{position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border-radius:50%;background:var(--es-panel-2);color:var(--es-muted);border:1px solid var(--es-line);font-size:15px;line-height:1;cursor:pointer}' +
      '.es-root .search-result-close:hover{color:var(--es-text)}' +
      '.es-root .es-rich p{margin:0 0 8px}' +
      '.es-root .es-rich ul,.es-root .es-rich ol{margin:4px 0 10px;padding-left:22px}' +
      '.es-root .es-rich h2,.es-root .es-rich h3,.es-root .es-rich h4{margin:12px 0 6px;line-height:1.4}' +
      '.es-root .es-rich blockquote{margin:8px 0;padding:2px 12px;border-left:3px solid var(--es-accent);color:var(--es-muted)}' +
      '.es-root .es-rich code{background:var(--es-panel-2);border:1px solid var(--es-line);border-radius:4px;padding:1px 5px;font-size:13px}' +
      '.es-root .es-rich strong{color:var(--es-text)}' +
      '@media (max-width:820px){.es-root .landing-search{flex-direction:row;flex-wrap:wrap}.es-root .landing-search-input{min-width:0}.es-root .landing-search button{width:auto;flex:none}.es-root .search-mode{flex:1 1 100%;width:100%;justify-content:center}.es-root .search-mode .search-mode-btn{flex:1 1 0;text-align:center}}',
    )

    slots.inject('conversation.top', () => slots.register(
      { name: 'conversation.top', id: 'english-search', order: -5, label: '英语搜索' },
      () => React.createElement(SearchBar),
    ))
  },
}
