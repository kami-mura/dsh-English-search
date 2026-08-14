// dsh-english-search —— Client bundle（手写，无构建步骤）
// 格式与 tsdown clientBundle 产物一致：CJS 闭包注册到 window.__ModuleLoader__，
// 工厂通过注入的 require 从 loader 模块表解析外部依赖（react 为平台模块）。
// 与 Host 通过同源 fetch 调用 /api/plugins/english-search 通信。
//
// v0.3.0 —— 复刻 vocabtool.com 搜索框（查词/词源/问答模式胶囊 + 玻璃胶囊
// 输入框 + DeepSeek 渐变按钮 + 同款结果面板），注册进 ui-conversation 新增的
// conversation.top 插槽：固定在聊天框最上面、随列头常驻（无会话时也显示）、
// 滚动时不动。

window.__ModuleLoader__.load({ id: 'dsh-english-search', factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var React = require('react');

var API = '/api/plugins/english-search';

// 样式 1:1 复刻 vocabflow-web 落地页搜索框（app/static/style.css 基础 + 玻璃
// 覆盖 + 暗色主题），类名与落地页一致，全部收在 .es-root 作用域下。
var CSS =
  '.es-root{--es-bg:#f7f9fd;--es-panel:#ffffff;--es-panel-2:#f5f7fc;--es-text:#152033;--es-muted:#6b7a90;--es-line:#e2e8f2;--es-accent:#007AFF;--es-accent-2:#0A84FF;--es-logo-2:#0A84FF;--es-primary:var(--es-accent);--es-unknown:#e84545;--es-shadow:0 1px 2px rgba(22,40,72,.04),0 8px 28px rgba(22,40,72,.07);--es-shadow-lg:0 12px 40px rgba(28,48,88,.12);--es-lookup-border:rgba(0,122,255,.35);--es-ease:cubic-bezier(.2,.8,.2,1);position:relative;display:flex;flex-direction:column;align-items:center;width:100%;min-width:0;box-sizing:border-box;padding:12px 28px 0 20px;margin-bottom:-8px;color:var(--es-text);font-size:15px;line-height:1.8;text-align:left}' +
  'body[data-ds-dark-theme] .es-root{--es-bg:#0f1420;--es-panel:#1a2130;--es-panel-2:#222b3d;--es-text:#e6ecf7;--es-muted:#9aa7bc;--es-line:#2c3850;--es-accent:#0A84FF;--es-accent-2:#409CFF;--es-logo-2:#409CFF;--es-unknown:#ef5d5d;--es-shadow:0 1px 2px rgba(0,0,0,.35),0 8px 28px rgba(0,0,0,.35);--es-shadow-lg:0 12px 40px rgba(0,0,0,.5);--es-lookup-border:rgba(64,156,255,.4)}' +
  '@media (prefers-color-scheme:dark){.es-root{--es-bg:#0f1420;--es-panel:#1a2130;--es-panel-2:#222b3d;--es-text:#e6ecf7;--es-muted:#9aa7bc;--es-line:#2c3850;--es-accent:#0A84FF;--es-accent-2:#409CFF;--es-logo-2:#409CFF;--es-unknown:#ef5d5d;--es-shadow:0 1px 2px rgba(0,0,0,.35),0 8px 28px rgba(0,0,0,.35);--es-shadow-lg:0 12px 40px rgba(0,0,0,.5);--es-lookup-border:rgba(64,156,255,.4)}}' +
  '.es-root .landing-search{display:flex;align-items:center;gap:8px;max-width:560px;width:100%;margin:0 auto 2px;padding:4px;border:1px solid rgba(226,232,242,.9);border-radius:999px;background:rgba(255,255,255,.78);box-shadow:var(--es-shadow-lg),inset 0 1px 0 rgba(255,255,255,.8);backdrop-filter:blur(18px) saturate(1.3);-webkit-backdrop-filter:blur(18px) saturate(1.3);transition:border-color .25s ease,box-shadow .25s ease,transform .25s var(--es-ease);box-sizing:border-box}' +
  '.es-root .landing-search:focus-within{border-color:rgba(0,122,255,.45);box-shadow:var(--es-shadow-lg),0 0 0 4px rgba(0,122,255,.12);transform:translateY(-1px)}' +
  'body[data-ds-dark-theme] .es-root .landing-search{background:rgba(26,33,48,.82);border-color:rgba(44,56,80,.9)}' +
  '@media (prefers-color-scheme:dark){.es-root .landing-search{background:rgba(26,33,48,.82);border-color:rgba(44,56,80,.9)}}' +
  '.es-root .landing-search-input{flex:1;min-width:0;display:flex;align-items:center;gap:2px;padding:2px 4px 2px 10px;background:var(--es-panel);border:1px solid var(--es-line);border-radius:999px}' +
  '.es-root .landing-search-input:focus-within{border-color:var(--es-accent);box-shadow:0 0 0 3px rgba(0,0,0,.08)}' +
  '.es-root .landing-search input{flex:1;min-width:0;padding:7px 0;font-size:14px;border:none;background:transparent;box-shadow:none;outline:none;color:var(--es-text)}' +
  '.es-root .landing-search input::placeholder{color:var(--es-muted)}' +
  '.es-root .landing-search input:-webkit-autofill,.es-root .landing-search input:-webkit-autofill:hover,.es-root .landing-search input:-webkit-autofill:focus{background-color:var(--es-panel)!important;-webkit-box-shadow:0 0 0 1000px var(--es-panel) inset!important;-webkit-text-fill-color:var(--es-text)!important}' +
  '.es-root .landing-search .landing-clear-btn{display:inline-flex;align-items:center;justify-content:center;flex:none;width:22px;height:22px;padding:0;border-radius:50%;background:var(--es-panel-2);color:var(--es-muted);border:1px solid var(--es-line);font-size:13px;line-height:1;cursor:pointer}' +
  '.es-root .landing-search .landing-clear-btn{border-color:transparent;background:rgba(238,242,250,.85)}' +
  '.es-root .landing-search .landing-clear-btn:hover{background:rgba(0,122,255,.08);color:var(--es-text)}' +
  'body[data-ds-dark-theme] .es-root .landing-search .landing-clear-btn{background:rgba(44,56,80,.55)}' +
  '@media (prefers-color-scheme:dark){.es-root .landing-search .landing-clear-btn{background:rgba(44,56,80,.55)}}' +
  '.es-root .search-mode{display:flex;align-items:center;gap:2px;flex:none;padding:3px;border:1px solid var(--es-line);border-radius:999px;background:var(--es-panel)}' +
  '.es-root .search-mode .search-mode-btn{border:none;background:transparent;color:var(--es-muted);font-size:13px;font-weight:600;padding:4px 10px;border-radius:999px;cursor:pointer;box-shadow:none}' +
  '.es-root .search-mode .search-mode-btn:hover{color:var(--es-text)}' +
  '.es-root .search-mode .search-mode-btn.active{background:var(--es-primary);color:var(--es-bg)}' +
  '.es-root .landing-search button{border-radius:999px;padding:8px 16px;font-size:14px;flex:none;cursor:pointer}' +
  '.es-root .landing-search .primary{background:var(--es-accent);background-image:linear-gradient(135deg,var(--es-accent) 0%,var(--es-logo-2) 100%),linear-gradient(115deg,transparent 30%,rgba(255,255,255,.26) 50%,transparent 70%);background-size:100% 100%,220% 100%;background-position:0 0,130% 0;border:1px solid var(--es-accent);color:#ffffff;box-shadow:none}' +
  '.es-root .landing-search .primary:hover,.es-root .landing-search .primary:active{background:#0a66de;background-image:none;border-color:#0a66de;color:#ffffff;box-shadow:none}' +
  'body[data-ds-dark-theme] .es-root .landing-search .primary{background:var(--es-accent);background-image:linear-gradient(135deg,var(--es-accent) 0%,var(--es-accent-2) 100%);border-color:var(--es-accent);color:#ffffff}' +
  'body[data-ds-dark-theme] .es-root .landing-search .primary:hover,body[data-ds-dark-theme] .es-root .landing-search .primary:active{background:#2f86f0;background-image:none;border-color:#2f86f0;color:#ffffff}' +
  '@media (prefers-color-scheme:dark){.es-root .landing-search .primary{background:var(--es-accent);background-image:linear-gradient(135deg,var(--es-accent) 0%,var(--es-accent-2) 100%);border-color:var(--es-accent);color:#ffffff}.es-root .landing-search .primary:hover,.es-root .landing-search .primary:active{background:#2f86f0;background-image:none;border-color:#2f86f0;color:#ffffff}}' +
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
  '@media (max-width:820px){.es-root .landing-search{flex-direction:row;flex-wrap:wrap}.es-root .landing-search-input{min-width:0}.es-root .landing-search button{width:auto;flex:none}.es-root .search-mode{flex:1 1 100%;width:100%;justify-content:center}.es-root .search-mode .search-mode-btn{flex:1 1 0;text-align:center}}';

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

// 与 vocabflow 落地页一致的占位文案（app/static/landing-v51.js SEARCH_PLACEHOLDERS）
var PLACEHOLDERS = {
  lookup: '输入单词，短语或者简短中文（双击可查词）',
  etymology: '输入英文单词，查词源，如 arena',
  qa: '输入英语问题，如 lie 和 lay 的区别',
};
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
          placeholder: PLACEHOLDERS[mode] || PLACEHOLDERS.lookup,
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
      React.createElement('button', { className: 'primary', type: 'submit' }, 'DeepSeek'),
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
  // 固定在聊天框最上面、常驻显示：ui-conversation 的 conversation.top 插槽
  // 挂在会话列根部（标题行之上），会话头部隐藏（空白/新会话）时依然可见。
  slots.inject('conversation.top', function () {
    return slots.register(
      { name: 'conversation.top', id: 'english-search', order: -5, label: '英语搜索' },
      SearchBar,
    );
  });
}

module.exports = { name: 'english-search', apply: apply };
return module.exports; } });
