// VocabFlow DSH 搜索栏插件 —— Client 半体（动态安装版）
// 用法：作为 cordis_define 的 code.client 提交（完整函数体，直接粘贴）。
// v0.4.2 —— 动态运行环境不提供 react-dom，保留在 conversation.input.dock；
// npm 原生插件由 lib/client.js 通过 React Portal 固定到会话区域最上方。
// 与 Host 通过 Package 私有 RPC 通信：host.call('lookup'|'quick'|'question', payload)。
return {
  inject: ['slots'],
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

    // 样式全部使用 DSH WebUI 设计令牌（--dsw-alias-* / --dsw-specific-* /
    // --dsw-shadow-lv2 / --dsw-font-family），表面/描边/圆角/阴影与输入框卡片
    // 一致，宽度收窄为独立搜索栏宽度（--es-bar-max-width），明暗主题自动跟随。
    styles.insert(
      '.es-root{--es-bar-max-width:520px;--es-btn-bg:var(--dsw-alias-button-info-hover);--es-btn-hover:var(--dsw-alias-button-info-fill);position:relative;display:flex;flex-direction:column;align-items:center;width:100%;min-width:0;box-sizing:border-box;padding:10px var(--dsh-composer-side-clearance) 0;gap:8px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);font-size:14px;line-height:22px;text-align:left}' +
      'body[data-ds-dark-theme] .es-root{--es-btn-bg:var(--dsw-alias-button-info-fill);--es-btn-hover:var(--dsw-alias-button-info-hover)}' +
      '.es-root .landing-search{display:flex;align-items:center;gap:6px;width:100%;max-width:var(--es-bar-max-width);margin:0 auto;padding:4px 4px 4px 8px;border:1px solid var(--dsw-alias-border-l2-darkmode-thin);border-radius:22px;background:var(--dsw-specific-input-major);box-shadow:var(--dsw-shadow-lv2);transition:border-color .2s ease,box-shadow .2s ease;box-sizing:border-box}' +
      '.es-root .landing-search:focus-within{border-color:var(--dsw-alias-border-l3);box-shadow:var(--dsw-shadow-lv2),0 0 0 3px var(--dsw-alias-interactive-bg-hover-accent)}' +
      '.es-root .search-mode{display:flex;align-items:center;gap:2px;flex:none}' +
      '.es-root .search-mode .search-mode-btn{border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;font-weight:500;padding:4px 10px;border-radius:8px;cursor:pointer;box-shadow:none;transition:background-color .1s ease,color .1s ease}' +
      '.es-root .search-mode .search-mode-btn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}' +
      '.es-root .search-mode .search-mode-btn.active{color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover)}' +
      '.es-root .landing-search-input{flex:1;min-width:0;display:flex;align-items:center;gap:2px}' +
      '.es-root .landing-search input{flex:1;min-width:0;padding:7px 0;font-size:14px;line-height:20px;border:none;background:transparent;box-shadow:none;outline:none;color:var(--dsw-alias-label-primary)}' +
      '.es-root .landing-search input::placeholder{color:var(--dsw-alias-label-caption)}' +
      '.es-root .landing-search input:-webkit-autofill,.es-root .landing-search input:-webkit-autofill:hover,.es-root .landing-search input:-webkit-autofill:focus{background-color:var(--dsw-specific-input-major)!important;-webkit-box-shadow:0 0 0 1000px var(--dsw-specific-input-major) inset!important;-webkit-text-fill-color:var(--dsw-alias-label-primary)!important}' +
      '.es-root .landing-search .landing-clear-btn{display:inline-flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;padding:0;border:none;border-radius:50%;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:1;cursor:pointer}' +
      '.es-root .landing-search .landing-clear-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}' +
      '.es-root .landing-search .primary{flex:none;height:28px;padding:0 12px;border:none;border-radius:8px;background:var(--es-btn-bg);color:#fff;font-size:13px;line-height:20px;font-weight:500;cursor:pointer;box-shadow:none;transition:background-color .1s ease}' +
      '.es-root .landing-search .primary:hover,.es-root .landing-search .primary:active{background:var(--es-btn-hover)}' +
      '.es-root .landing-search-result{position:relative;width:100%;max-width:var(--es-bar-max-width);margin:0 auto;padding:14px 40px 14px 18px;border:1px solid var(--dsw-alias-border-l2-darkmode-thin);border-radius:16px;background:var(--dsw-specific-input-major);box-shadow:var(--dsw-shadow-lv2);color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px;text-align:left;white-space:pre-wrap;max-height:55vh;overflow:auto;box-sizing:border-box}' +
      '.es-root .landing-search-result.loading{color:var(--dsw-alias-label-secondary)}' +
      '.es-root .landing-search-result.error{color:var(--dsw-alias-state-error-primary)}' +
      '.es-root .search-result-close{position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:none;border-radius:50%;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:15px;line-height:1;cursor:pointer}' +
      '.es-root .search-result-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}' +
      '.es-root .es-rich p{margin:0 0 8px}' +
      '.es-root .es-rich ul,.es-root .es-rich ol{margin:4px 0 10px;padding-left:22px}' +
      '.es-root .es-rich h2,.es-root .es-rich h3,.es-root .es-rich h4{margin:12px 0 6px;line-height:1.4}' +
      '.es-root .es-rich blockquote{margin:8px 0;padding:2px 12px;border-left:3px solid var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-secondary)}' +
      '.es-root .es-rich code{background:var(--dsw-alias-markdown-inline-code);border:1px solid var(--dsw-alias-border-l2);border-radius:4px;padding:1px 5px;font-size:13px}' +
      '.es-root .es-rich strong{color:var(--dsw-alias-label-primary)}' +
      '@media (max-width:820px){.es-root .landing-search{flex-wrap:wrap}.es-root .search-mode{flex:1 1 100%;order:-1;justify-content:center}.es-root .search-mode .search-mode-btn{flex:1 1 0;text-align:center}}',
    )

    slots.inject('conversation.input.dock', () => slots.register(
      { name: 'conversation.input.dock', id: 'english-search', order: -5, label: '英语搜索' },
      () => React.createElement(SearchBar),
    ))
  },
}
