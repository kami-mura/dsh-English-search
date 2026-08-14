// dsh-english-search —— Client bundle（手写，无构建步骤）
// 格式与 tsdown clientBundle 产物一致：CJS 闭包注册到 window.__ModuleLoader__，
// 工厂通过注入的 require 从 loader 模块表解析外部依赖（react 为平台模块）。
// 与 Host 通过同源 fetch 调用 /api/plugins/english-search 通信。

window.__ModuleLoader__.load({ id: 'dsh-english-search', factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var React = require('react');

var API = '/api/plugins/english-search';

var CSS =
  '.es-search{--es-bg:#f7f9fd;--es-panel:#ffffff;--es-panel-2:#f5f7fc;--es-text:#152033;--es-muted:#6b7a90;--es-line:#e2e8f2;--es-accent:#007AFF;--es-accent-2:#0A84FF;--es-unknown:#e84545;--es-shadow:0 1px 2px rgba(22,40,72,.04),0 8px 28px rgba(22,40,72,.07);pointer-events:auto}' +
  '@media (prefers-color-scheme:dark){.es-search{--es-bg:#0f1420;--es-panel:#1a2130;--es-panel-2:#222b3d;--es-text:#e6ecf7;--es-muted:#9aa7bc;--es-line:#2c3850;--es-accent:#0A84FF;--es-accent-2:#409CFF;--es-unknown:#ef5d5d;--es-shadow:0 1px 2px rgba(0,0,0,.35),0 8px 28px rgba(0,0,0,.35)}}' +
  '.es-topbar{position:fixed;top:12px;right:16px;left:auto;width:auto;z-index:9000;background:transparent;border:none;padding:0}' +
  '.es-form{display:flex;align-items:center;gap:8px}' +
  '.es-capsule{flex:1;min-width:0;max-width:min(46vw,420px);display:flex;align-items:center;gap:4px;padding:4px 6px 4px 12px;background:var(--es-panel);border:1px solid var(--es-line);border-radius:999px;box-shadow:0 1px 2px rgba(22,40,72,.06),0 6px 20px rgba(22,40,72,.10)}' +
  '.es-capsule:focus-within{border-color:var(--es-accent);box-shadow:0 0 0 3px rgba(0,0,0,.08)}' +
  '.es-capsule input{flex:1;min-width:0;padding:10px 0;font-size:16px;border:none;background:transparent;box-shadow:none;outline:none;color:var(--es-text)}' +
  '.es-capsule input::placeholder{color:var(--es-muted)}' +
  '.es-clear{display:inline-flex;align-items:center;justify-content:center;flex:none;width:30px;height:30px;padding:0;border-radius:50%;background:var(--es-panel-2);color:var(--es-muted);border:1px solid var(--es-line);font-size:16px;line-height:1;cursor:pointer}' +
  '.es-clear:hover{color:var(--es-text)}' +
  '.es-go{border-radius:999px;padding:11px 20px;font-size:15px;flex:none;border:1px solid var(--es-accent);background:linear-gradient(135deg,var(--es-accent) 0%,var(--es-accent-2) 100%),linear-gradient(115deg,transparent 30%,rgba(255,255,255,.26) 50%,transparent 70%);background-size:100% 100%,220% 100%;background-position:0 0,130% 0;color:#fff;cursor:pointer}' +
  '.es-go:hover,.es-go:active{background:#0a66de;border-color:#0a66de;color:#fff}' +
  '@media (prefers-color-scheme:dark){.es-go{background:linear-gradient(135deg,var(--es-accent) 0%,var(--es-accent-2) 100%);border-color:var(--es-accent);color:#fff}.es-go:hover,.es-go:active{background:#2f86f0;border-color:#2f86f0;color:#fff}}' +
  '.es-go:disabled{opacity:.65;cursor:default}' +
  '.es-panel{position:fixed;top:66px;left:50%;transform:translateX(-50%);z-index:9001;width:min(720px,calc(100% - 24px));max-height:60vh;overflow:auto;padding:16px 20px;padding-right:44px;border-radius:16px;background:var(--es-panel);border:1px solid var(--es-line);box-shadow:var(--es-shadow);color:var(--es-text);font-size:15px;line-height:1.8;text-align:left}' +
  '.es-panel-loading{color:var(--es-muted)}' +
  '.es-panel-error{color:var(--es-unknown)}' +
  '.es-close{position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border-radius:50%;background:var(--es-panel-2);color:var(--es-muted);border:1px solid var(--es-line);font-size:15px;line-height:1;cursor:pointer}' +
  '.es-close:hover{color:var(--es-text)}' +
  '.es-rich p{margin:0 0 8px}' +
  '.es-rich ul,.es-rich ol{margin:4px 0 10px;padding-left:22px}' +
  '.es-rich h2,.es-rich h3,.es-rich h4{margin:12px 0 6px;line-height:1.4}' +
  '.es-rich blockquote{margin:8px 0;padding:2px 12px;border-left:3px solid var(--es-accent);color:var(--es-muted)}' +
  '.es-rich code{background:var(--es-panel-2);border:1px solid var(--es-line);border-radius:4px;padding:1px 5px;font-size:13px}' +
  '.es-rich strong{color:var(--es-text)}';

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function inlineMarkdown(s) {
  var out = escapeHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return out;
}
function richHtml(text) {
  var lines = String(text || '').split('\n');
  var html = '';
  var listTag = '';
  function closeList() { if (listTag) { html += '</' + listTag + '>'; listTag = ''; } }
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (/^[-*•]\s+/.test(line)) {
      if (listTag !== 'ul') { closeList(); html += '<ul>'; listTag = 'ul'; }
      html += '<li>' + inlineMarkdown(line.replace(/^[-*•]\s+/, '')) + '</li>';
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      if (listTag !== 'ol') { closeList(); html += '<ol>'; listTag = 'ol'; }
      html += '<li>' + inlineMarkdown(line.replace(/^\d+[.)]\s+/, '')) + '</li>';
      continue;
    }
    closeList();
    if (/^###\s+/.test(line)) { html += '<h4>' + inlineMarkdown(line.replace(/^###\s+/, '')) + '</h4>'; continue; }
    if (/^##\s+/.test(line)) { html += '<h3>' + inlineMarkdown(line.replace(/^##\s+/, '')) + '</h3>'; continue; }
    if (/^#\s+/.test(line)) { html += '<h2>' + inlineMarkdown(line.replace(/^#\s+/, '')) + '</h2>'; continue; }
    if (/^>\s+/.test(line)) { html += '<blockquote>' + inlineMarkdown(line.replace(/^>\s+/, '')) + '</blockquote>'; continue; }
    html += line ? '<p>' + inlineMarkdown(line) + '</p>' : '';
  }
  closeList();
  return html;
}

var PLACEHOLDERS = {
  lookup: '输入单词，短语或者简短中文',
  etymology: '输入英文单词，查词源，如 arena',
  qa: '输入英语问题，如 lie 和 lay 的区别',
};

function SearchBar() {
  var state = React.useState('lookup');
  var mode = state[0];
  var setMode = state[1];
  var state2 = React.useState('');
  var text = state2[0];
  var setText = state2[1];
  var state3 = React.useState(false);
  var busy = state3[0];
  var setBusy = state3[1];
  var state4 = React.useState(null);
  var result = state4[0];
  var setResult = state4[1];
  var inputEl = null;

  function doSearch() {
    var raw = text.trim();
    if (!raw || busy) return;
    var m = mode;
    var q = raw;
    var quickPrefix = raw.startsWith('!') || raw.startsWith('！');
    var qaPrefix = raw.startsWith('?') || raw.startsWith('？');
    if (quickPrefix && raw.length > 1) { m = 'quick'; q = raw.slice(1).trim(); }
    else if (qaPrefix && raw.length > 1) { m = 'qa'; q = raw.slice(1).trim(); }
    else if (m === 'etymology') { m = 'quick'; }
    else if (m === 'qa') { m = 'qa'; }
    if (!q) {
      setResult({ error: m === 'qa' ? '请输入要问的英语问题' : '请输入要查询的单词' });
      return;
    }
    setBusy(true);
    setResult(null);
    var body = m === 'qa' ? { action: 'question', question: q } : { action: m === 'quick' ? 'quick' : 'lookup', text: q };
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (res) { return res.json().catch(function () { return {}; }); })
      .then(function (data) {
        setResult(data && data.text ? { text: data.text } : { error: (data && data.error) || '查询失败' });
      })
      .catch(function () { setResult({ error: '查询服务不可用' }); })
      .finally(function () { setBusy(false); });
  }

  function clear() {
    setResult(null);
    setText('');
    if (inputEl) inputEl.focus();
  }

  var showPanel = busy || result !== null;
  return React.createElement(
    'div',
    { className: 'es-search' },
    React.createElement(
      'div',
      { className: 'es-topbar' },
      React.createElement(
        'div',
        { className: 'es-form' },
        React.createElement(
          'div',
          { className: 'es-capsule' },
          React.createElement('input', {
            ref: function (el) { inputEl = el; },
            type: 'text',
            value: text,
            placeholder: PLACEHOLDERS[mode] || PLACEHOLDERS.lookup,
            'aria-label': '搜索单词',
            onChange: function (e) { setText(e.target.value); },
            onKeyDown: function (e) {
              if (e.key === 'Enter') doSearch();
              if (e.key === 'Escape') clear();
            },
          }),
          text
            ? React.createElement('button', { className: 'es-clear', type: 'button', 'aria-label': '清空搜索', onClick: function () { setText(''); } }, '×')
            : null,
        ),
        React.createElement(
          'button',
          { className: 'es-go', type: 'button', onClick: doSearch, disabled: busy || !text.trim() },
          busy ? '查询中' : 'DeepSeek',
        ),
      ),
    ),
    showPanel
      ? React.createElement(
          'div',
          { className: 'es-panel' },
          React.createElement('button', { className: 'es-close', type: 'button', 'aria-label': '关闭结果', onClick: clear }, '×'),
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
  );
}

function apply(ctx) {
  var slots = ctx.get('slots');
  if (slots === undefined) return;
  var style = document.createElement('style');
  style.dataset.plugin = 'dsh-english-search';
  style.textContent = CSS;
  document.head.appendChild(style);
  ctx.effect(function () {
    return function () {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  });
  slots.inject('shell.overlay', function () {
    return slots.register(
      { name: 'shell.overlay', id: 'vocabflow-search' },
      function () { return React.createElement(SearchBar); },
    );
  });
}

module.exports = { name: 'english-search', apply: apply };
return module.exports; } });
