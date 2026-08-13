# VocabFlow DSH 搜索栏插件

在 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）界面最上方复刻 [vocabtool.com](https://vocabtool.com) 搜索框的 Cordis 动态插件：**查词 / 词源 / 问答**三种模式，查词由 DSH 自身的 LLM 服务完成，不访问任何外部站点、不需要数据库、不需要本地后端。

## 功能

- 固定显示在 DSH 界面最上方的搜索栏，样式 1:1 复刻 vocabtool.com（999px 胶囊输入框、查词/词源/问答胶囊切换、渐变蓝色按钮、暗色主题适配）
- 三种模式，placeholder 随模式切换（与网站一致）：
  - 查词：单词 / 短语 / 中文释义
  - 词源：英文单词词源史诗
  - 问答：英语学习问题
- 快捷前缀：`!arena` 直接词源、`?lie 和 lay 的区别` 直接问答
- 结果面板渲染 Markdown（加粗 / 列表 / 标题 / 引用 / 行内代码）
- 查词走当前会话默认模型（`agentDefaultModel`），与对话共用同一个 DSH 模型配额

## 架构

```
浏览器 (Client)                          DSH Host
┌──────────────────────────┐   RPC   ┌──────────────────────────┐
│ shell.overlay 插槽       │ ──────► │ harness.handle           │
│ 顶部固定搜索栏 + 结果面板 │         │  lookup / quick /question│
│ React + styles + host    │  ◄────── │  → ctx.llm.stream()      │
└──────────────────────────┘  JSON   │  (当前默认模型，effort=off│
                                      │   失败自动回退无 effort) │
                                      └──────────────────────────┘
```

- **Client**：注册在 `shell.overlay` 插槽（id `vocabflow-search`），纯 React，样式用主题无关的固定色值（与 vocabtool.com 一致），暗色模式走 `prefers-color-scheme`
- **Host**：通过 `ctx.get('llm')` 与 `ctx.get('agentDefaultModel')` 调用 DSH 模型；三套系统提示词与 vocabtool.com 后端一致（源自 MIT 项目 [kami-mura/vocabtool-web](https://github.com/kami-mura/vocabtool-web)）
- 无外部 HTTP 调用、无 Cookie、无数据库、无本地服务

## 安装

1. 在 DSH 会话中调用 `cordis_define`：
   - `plugin.kind: "new"`，`idPrefix: "vocab"`
   - `code.host` ← 粘贴 [`plugin.host.js`](plugin.host.js) 的完整内容
   - `code.client` ← 粘贴 [`plugin.client.js`](plugin.client.js) 的完整内容
2. 调用 `cordis_run` 激活（Client 包首次需要用户批准一次）
3. 完成后界面最上方出现搜索栏，直接输入即可

> 依赖 DSH 运行时能力：`llm`、`agentDefaultModel` 服务（Host），`slots` / `styles` / `host` / `React`（Client）。插件为纯 JavaScript，无 TypeScript、无构建步骤。

## 文件

| 文件 | 说明 |
| --- | --- |
| `plugin.host.js` | Host 半体：LLM 查词调用（`cordis_define` 的 `code.host`） |
| `plugin.client.js` | Client 半体：搜索栏 UI（`cordis_define` 的 `code.client`） |

## License

[MIT](LICENSE)
