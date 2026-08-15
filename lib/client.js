// dsh-english-search —— Client bundle（手写，无构建步骤）
// 格式与 tsdown clientBundle 产物一致：CJS 闭包注册到 window.__ModuleLoader__，
// 工厂通过注入的 require 从 loader 模块表解析外部依赖（react 为平台模块）。
// 与 Host 通过同源 fetch 调用 /api/plugins/english-search 通信。
//
// v0.4.2 —— DSH 原生风格搜索栏（查词/词源/问答）。rc.6 尚无
// conversation.top，因此通过 conversation.input.dock 管理生命周期，再用
// React Portal 固定到会话根节点最上方；后续 DSH 仍可沿用同一兼容路径。

window.__ModuleLoader__.load({ id: 'dsh-english-search', factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var React = require('react');
var ReactDOM = require('react-dom');

var API = '/api/plugins/english-search';

// 样式全部使用 DSH WebUI 设计令牌（ui-theme 的 --dsw-alias-* / --dsw-specific-* /
// --dsw-shadow-lv2 / --dsw-font-family），表面/描边/圆角/阴影与输入框卡片一致，
// 宽度收窄为独立搜索栏宽度（--es-bar-max-width），明暗主题自动跟随。
var CSS =
  '.es-root{--es-bar-max-width:520px;--es-btn-bg:var(--dsw-alias-button-info-hover);--es-btn-hover:var(--dsw-alias-button-info-fill);position:relative;order:-100;display:flex;flex:none;flex-direction:column;align-items:center;width:100%;min-width:0;box-sizing:border-box;padding:10px var(--dsh-composer-side-clearance);gap:8px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);font-size:14px;line-height:22px;text-align:left}' +
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
  '@media (max-width:820px){.es-root .landing-search{flex-wrap:wrap}.es-root .search-mode{flex:1 1 100%;order:-1;justify-content:center}.es-root .search-mode .search-mode-btn{flex:1 1 0;text-align:center}}';

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

// 与 vocabflow 落地页一致的三种查询模式（查词/词源/问答）
var MODES = [
  ['lookup', '查词'],
  ['etymology', '词源'],
  ['qa', '问答'],
];

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

  function runSearch(raw) {
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
      setResult({ error: m === 'qa'
        ? '请在 ? 后面输入问题，如：?lie 和 lay 的区别'
        : '请在 ! 后面输入单词，如：!arena' });
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

  function doSearch() {
    runSearch(text.trim());
  }

  function clear() {
    setResult(null);
    setText('');
    if (inputEl) inputEl.focus();
  }

  function pickMode(id) {
    setMode(id);
    if (inputEl) inputEl.focus();
  }

  // 与落地页一致：双击输入框选中词即查词
  function onInputDoubleClick() {
    if (!inputEl || inputEl.selectionStart == null) return;
    var selected = inputEl.value
      .substring(inputEl.selectionStart, inputEl.selectionEnd)
      .replace(/\s+/g, ' ')
      .trim();
    if (selected && selected.length <= 200) {
      setText(selected);
      runSearch(selected);
    }
  }

  var showPanel = busy || result !== null;
  var panelClass = 'landing-search-result';
  if (busy && !result) panelClass += ' loading';
  if (result && result.error) panelClass += ' error';

  return React.createElement(
    'div',
    { className: 'es-root' },
    React.createElement(
      'form',
      { className: 'landing-search', onSubmit: function (e) { e.preventDefault(); doSearch(); } },
      React.createElement(
        'div',
        { className: 'search-mode', role: 'group', 'aria-label': '查询模式' },
        MODES.map(function (entry) {
          var id = entry[0];
          var label = entry[1];
          var active = mode === id;
          return React.createElement('button', {
            key: id,
            type: 'button',
            className: 'search-mode-btn' + (active ? ' active' : ''),
            'data-search-mode': id,
            'aria-pressed': active ? 'true' : 'false',
            onClick: function () { pickMode(id); },
          }, label);
        }),
      ),
      React.createElement(
        'div',
        { className: 'landing-search-input' },
        React.createElement('input', {
          ref: function (el) { inputEl = el; },
          type: 'text',
          name: 'q',
          value: text,
          'aria-label': '搜索单词',
          onChange: function (e) { setText(e.target.value); },
          onKeyDown: function (e) {
            if (e.key === 'Enter') doSearch();
            if (e.key === 'Escape') clear();
          },
          onDoubleClick: onInputDoubleClick,
        }),
        text
          ? React.createElement('button', { className: 'landing-clear-btn', type: 'button', 'aria-label': '清空搜索', onClick: function () { setText(''); } }, '×')
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
  );
}

function TopSearchBar() {
  var scrollBody = document.querySelector('[data-conversation-scroll]');
  var conversationRoot = scrollBody && scrollBody.parentElement;
  if (!conversationRoot) return React.createElement(SearchBar);
  return ReactDOM.createPortal(React.createElement(SearchBar), conversationRoot);
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
  // rc.6 与后续 DSH 均提供 input.dock；TopSearchBar 再 Portal 到会话根部。
  slots.inject('conversation.input.dock', function () {
    return slots.register(
      { name: 'conversation.input.dock', id: 'english-search', order: -5, label: '英语搜索' },
      TopSearchBar,
    );
  });
}

module.exports = { name: 'english-search', inject: ['slots'], apply: apply };
return module.exports; } });
