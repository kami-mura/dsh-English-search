# dsh-english-search

在 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）聊天框最上面复刻 [vocabtool.com](https://vocabtool.com) 搜索框的插件：**查词 / 词源 / 问答**三种模式，查词由 DSH 自身的 LLM 服务完成——不访问任何外部站点、不需要数据库、不需要本地后端。

## 功能

- 固定在聊天框最上面的搜索栏（会话列根部常驻：即使没有打开的会话、处于空白/新会话状态也始终显示；有会话时在标题行之上、随列头固定不随消息滚动），样式 1:1 复刻 vocabtool.com：玻璃胶囊搜索框、查词/词源/问答胶囊切换、渐变蓝色 DeepSeek 按钮、暗色主题适配
- 原有会话头部（标题/面包屑、标准模式、标签页）完整保留在搜索框下方
- 三种模式，placeholder 随模式切换（与网站一致）：
  - 查词：输入单词，短语或者简短中文（双击可查词）
  - 词源：输入英文单词，查词源，如 arena
  - 问答：输入英语问题，如 lie 和 lay 的区别
- 快捷前缀：`!arena` 直接词源、`?lie 和 lay 的区别` 直接问答
- 结果面板样式与落地页一致（loading / error / 同款结果卡片 + 关闭按钮），内容渲染 Markdown（加粗 / 列表 / 标题 / 引用 / 行内代码）
- 查词走 DSH 当前会话默认模型（`agentDefaultModel`），与对话共用模型配额

## 架构

```
浏览器 (Client)                            DSH Host
┌──────────────────────────┐  fetch   ┌──────────────────────────┐
│ conversation.top 插槽     │ ───────► │ webServer 路由            │
│ 聊天框最上面常驻搜索栏     │ POST     │ /api/plugins/english-search│
│ React + 手写 bundle      │  ◄────── │  → ctx.llm.stream()       │
└──────────────────────────┘  JSON    │  (当前默认模型, effort=off │
                                      │   失败自动回退无 effort)   │
                                      └──────────────────────────┘
```

- **Host**（[`lib/index.js`](lib/index.js)）：注册 `webServer` 路由，经 `ctx.get('llm')` + `ctx.get('agentDefaultModel')` 调用 DSH 模型；三套系统提示词与 vocabtool.com 后端一致（源自 MIT 项目 [kami-mura/vocabtool-web](https://github.com/kami-mura/vocabtool-web)）
- **Client**（[`lib/client.js`](lib/client.js)）：手写 CJS bundle（与 tsdown `clientBundle` 产物同格式：`window.__ModuleLoader__.load({ id, factory })`），注册在 `conversation.top` 插槽（id `english-search`）——该插槽由 ui-conversation 提供，挂在会话列根部、无论有无会话都渲染；同源 fetch 调用 Host 路由；样式复刻落地页（固定色值 + `prefers-color-scheme` / `data-ds-dark-theme` 暗色适配）
- 无外部 HTTP 调用、无 Cookie、无数据库、无本地服务、无构建步骤

## 安装（原生插件，永久生效）

```bash
# 1. 安装到 web profile（本地路径或 GitHub）
dsh plugin --profile web add /path/to/dsh-english-search
#   或: dsh plugin --profile web add github:kami-mura/dsh-English-search

# 2. 在 profile 的 cordis.patch.yml 追加：
#    - insert:
#        - id: english-search
#          name: dsh-english-search

# 3. 重启 dsh web 服务，刷新页面
```

> 依赖 DSH 运行时能力：Host `llm` / `agentDefaultModel` / `webServer` 服务；Client `slots` 服务与 `react` 平台模块（DSH 内置）。包名 `dsh-english-search`（npm 命名规范，全小写）。

## 安装（动态插件，快速体验）

不安装部署时，也可在任意 DSH 会话中通过 `cordis_define` 动态运行：

1. `cordis_define`：`plugin.kind: "new"`，`idPrefix: "vocab"`
   - `code.host` ← 粘贴 [`plugin.host.js`](plugin.host.js)
   - `code.client` ← 粘贴 [`plugin.client.js`](plugin.client.js)
2. `cordis_run` 激活（Client 包首次需批准一次）

## 文件

| 文件 | 说明 |
| --- | --- |
| `lib/index.js` | 原生包 Host 半体（webServer 路由 + LLM 调用） |
| `lib/client.js` | 原生包 Client bundle（手写，vocabtool 同款搜索栏 UI） |
| `package.json` | 包声明（`dsh.client.platform: "web"`） |
| `plugin.host.js` / `plugin.client.js` | 动态插件快速安装版（同一套逻辑） |

## License

[MIT](LICENSE)
