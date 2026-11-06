# AI Agent

AI Agent 是 HuHoBotPenguin 的增强功能，让管理员可以通过 QQ 群直接管理 Minecraft 服务器。

通过 `/agent` 命令启动 AI 会话，AI 可以：

- 查看服务器插件列表和命令帮助
- 执行服务器命令（如白名单、封禁等）
- 读取服务器日志
- 管理 QQ 群设置（审批入群、禁言等）

## 启用

在 `config.yml` 中配置：

```yaml
agent:
  enabled: true
  base-url: "https://api.openai.com/v1"
  api-key: "your-api-key"
  model: "gpt-4o-mini"
  command-mode: "manual"
  hide-fetch-results: true   # 获取类结果（插件列表、日志等）只交 AI，不在群里发卡片（默认开启）
```

需要 OpenAI 兼容的 Chat Completions 接口（支持 function calling）。

## 命令

| 命令 | 参数 | 说明 | 权限 |
|---|---|---|---|
| `/agent` | `(任务描述)` | 启动 AI Agent 执行任务 | 管理员 |
| `/newsession` | — | 清除 AI 会话上下文 | 管理员 |
| `/stop` | — | 紧急停止所有 AI 任务 | 管理员 |
| `/压缩` | — | 把较早的对话压缩成摘要 | 管理员 |
| `/压缩token` | `[数值]` | 查看或设置压缩目标 token 数 | 管理员 |
| `/压缩保留` | `[条数]` | 查看或设置压缩保留的最近消息条数 | 管理员 |
| `/删除信息` | `[条数]` | 删除上下文里最早的消息 | 管理员 |

## 执行模式

### 自动模式（auto）

AI 直接执行命令，无需人工审批。适合信任 AI 判断的场景。

```
玩家：/agent 查看当前在线玩家
HuHoBot：🤖 正在执行...
HuHoBot：当前在线玩家：3人
HuHoBot：- Steve
HuHoBot：- Alex
HuHoBot：- Notch
```

### 手动模式（manual）

执行命令前需要管理员在 QQ 按钮卡片上点击审批。适合需要人工确认的场景。

```
玩家：/agent 重启服务器
HuHoBot：🤖 AI 建议执行以下命令：
HuHoBot：[重启服务器] [取消]
（管理员点击"重启服务器"按钮后执行）
```

## 服务器管理工具

AI Agent 可以调用以下工具：

| 工具 | 说明 |
|------|------|
| `get_server_plugin_list` | 获取已安装插件列表 |
| `get_command_help` | 获取命令帮助信息 |
| `run_command` | 执行服务器控制台命令（需审批） |
| `read_server_logs` | 读取服务端日志（支持关键词过滤） |
| `load_skill` | 加载 MC 命令语法文档（components/give/item/summon/data/loot/clear） |

## QQ 群管理工具

| 工具 | 说明 |
|------|------|
| `get_group_info` | 获取群基本信息 |
| `get_bot_state` | 获取机器人在群内的状态 |
| `get_join_requests` | 列出待审批的入群申请 |
| `approve_join_request` | 审批入群申请 |
| `get_mute_status` | 查询群禁言状态 |
| `set_member_mute` | 设置/解除成员禁言（最长 30 天，需审批） |
| `list_auto_approve_policies` | 列出自动审批策略 |
| `create_auto_approve_policy` | 创建自动审批策略（需审批） |
| `update_auto_approve_policy` | 更新自动审批策略（需审批） |
| `delete_auto_approve_policy` | 删除自动审批策略（需审批） |
| `execute_auto_approve_policy` | 执行自动审批策略（需审批） |
| `update_whitelist_users` | 更新自动审批白名单 QQ 号（需审批） |

## SKILL 系统

AI Agent 支持按需加载 Minecraft 命令语法文档，帮助 AI 更准确地生成命令。

可用的 Skill 文档（`load_skill` 的 `name` 参数）：

| Skill | 说明 |
|-------|------|
| `components` | 物品组件语法（1.20.5+） |
| `give` | `/give` 命令语法 |
| `item` | 物品格式与 NBT |
| `summon` | `/summon` 实体命令 |
| `data` | `/data` 数据操作命令 |
| `loot` | `/loot` 掉落物命令 |
| `clear` | `/clear` 清除物品命令 |

AI 会在需要时自动加载相关 Skill，也可以通过 `load_skill` 工具手动加载。

## 会话管理

- 每个用户独立的会话上下文
- 最大保留 40 条消息（超出后自动裁剪最早的消息，裁剪会避开 `tool_calls` 与 `tool` 的配对）
- 同一用户重复 `/agent` 会复用之前的会话
- `/newsession` 清除上下文，开始全新对话
- `/压缩`、`/删除信息` 手动整理上下文，见下文「上下文压缩」
- 长时间无操作会自动清理会话

## 深度思考

程序提供两种让模型"思考"的方式，二者**互斥**，按模型能力二选一：

- **深度思考**（`agent.think`）：给**原生支持推理**的模型用，开启后向接口附加思考参数（配合 `agent.think-level` 与 `agent.think-param`）。
- **思考引导**（`agent.think-guide`）：给**不具备原生推理能力**的模型用，追加提示词让模型用 `[思考]` 模拟思考。

只要开启了思考引导，深度思考相关设置（`agent.think` / `agent.think-level` / `agent.think-param`）就**全部不生效**，避免两种思考方式叠加。

```yaml
agent:
  think: true                # 深度思考（原生推理模型用）
  think-visibility: "log"    # 思考过程往哪儿送
  think-param: "reasoning_effort"   # 思考参数名（深度思考）
  think-level: "high"        # 推理设置（深度思考）
  think-guide: false         # 思考引导（非推理模型用），开启后上面三项不生效
  think-guide-prompt: |      # 引导提示词，留空用内置
    ...
```

| 配置 | 作用 |
| --- | --- |
| `agent.think` | 深度思考开关：原生推理模型用，开启后才向接口附加思考参数 |
| `agent.think-guide` | 思考引导开关：非推理模型用，开启后深度思考相关设置不生效 |
| `agent.think-visibility` | 决定思考过程送到哪里（两种方式共用） |

> 深度思考相关的设置只在配置文件（或 WebUI）里调整，QQ 群里不提供设置命令。

### 思考过程展示方式

| 取值 | 效果 |
| --- | --- |
| `log`（默认） | 只写进服务器日志，不在群里发，避免刷屏 |
| `group` | 作为「思考」卡片发到 QQ 群 |
| `both` | 两边都发 |

不论思考内容来自原生推理模型（`reasoning_content` / `reasoning`）还是思考引导的 `[思考]` 标签，都会按这个设置送出去。

### 推理设置

在配置文件里填 `agent.think-level`：

```yaml
agent:
  think-level: "high"
```

档位支持 `none` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`，也可以填整数 token 预算（如 `10000`，`-1` 表示由模型自行决定）或开关值 `true` / `false`。

思考参数各家厂商差别很大，用 `agent.think-param` 选参数名：

| 参数名 | 请求体里长什么样 | 常见厂商 |
| --- | --- | --- |
| `reasoning_effort` | `"reasoning_effort": "high"` | OpenAI |
| `effort` | `"reasoning_effort": "high"` | 部分网关的别名 |
| `thinking_level` | `"thinking_level": "high"` | Gemini |
| `reasoning.effort` | `"reasoning": { "effort": "high" }` | 嵌套风格网关 |
| `thinking.type` | `"thinking": { "type": "enabled" }`，填整数时附带 `budget_tokens` | Anthropic 风格 |
| `thinking_budget` | `"thinking_budget": 10000` | OpenRouter 风格 |
| `enable_thinking` | `"enable_thinking": true` | Qwen / DeepSeek 风格 |

档位和参数名对不上时（例如把 token 预算填给只认字符串档位的 `reasoning_effort`）**不会让请求失败**，只在日志里给出提示并按原样发送。

### 思考引导

在配置文件里把 `agent.think-guide` 设为 `true`（或在 WebUI 里打开）：

```yaml
agent:
  think-guide: true
```

给**不具备原生推理能力**的模型用：追加一段提示词要求模型把分析过程写进 `[思考]` 标签，程序再把标签里的内容取出来当思考过程、从正文里剥离，标签之外的内容才是发到群里的答复。

内置提示词要求模型依次完成：任务理解 → 信息盘点 → 方案拆解 → 风险校验 → 自检，并明确禁止把过程性表述写进最终答复。提示词可在 `agent.think-guide-prompt` 里改写。

> 标签用 `[思考]` / `[/思考]` 而不是 `<think>`：部分厂商的接口（如 AgnesAI）会把 `<think>` 当成特殊标记直接剥掉，导致思考块凭空消失；程序同时兼容 `<think>` / `<thinking>`，方便沿用旧提示词。

::: warning

思考引导与深度思考互斥：开启思考引导后，`agent.think`、`agent.think-level`、`agent.think-param` 一律不生效。原生推理模型请直接用深度思考，不要再开引导。

:::

### 看不到思考过程？

按下面的顺序排查：

1. **展示方式**：`agent.think-visibility` 默认是 `log`，思考只写进服务器日志、不发群；想在群里看到就改成 `group` 或 `both`。
2. **原生模型没开思考**：模型本身是推理模型时（接口返回 `reasoning_content`），必须开 `agent.think` 并配好 `agent.think-param` / `agent.think-level`，否则接口不会返回思考内容。
3. **思考引导对推理模型无效**：`agent.think-guide` 是给**非推理模型**用的。原生推理模型一般不会按提示词输出 `[思考]` 块，给它开引导通常看不到效果，应改用深度思考。
4. **接口吞掉了标签**：个别厂商的接口会把 `<think>` 当成特殊标记直接剥掉（AgnesAI 实测如此），思考块会凭空消失。程序默认用 `[思考]` / `[/思考]` 并兼容 `<think>` / `<thinking>`，自定义提示词时请沿用 `[思考]`。

用 `/agent` 跑一个简单任务，看服务器日志里有没有「Agent 思考过程」字样，可以快速判断思考内容到底有没有被提取到。

## 上下文压缩

对话历史按 token 计量（一条服务器日志就可能上万字符），上下文长了既贵又容易超出模型窗口。手动整理用这几个命令：

| 命令 | 说明 |
| --- | --- |
| `/压缩` | 把较早的对话压缩成一份结构化摘要，保留最近若干条原样消息 |
| `/压缩token [数值]` | 查看或设置压缩后的目标 token 数 |
| `/压缩保留 [条数]` | 查看或设置压缩时保留的最近消息条数 |
| `/删除信息 [条数]` | 直接删除上下文里最早的消息，不做摘要 |

命令执行完会回报压缩前后的消息条数与 token 估算：

```
🗑️ 已删除最早的 3 条消息
- 消息条数：11 → 8
- 估算 token：1402 → 980
```

### 摘要里保留什么

压缩提示词（`agent.context.compress.prompt`，支持 `{target}` 占位符）要求模型按固定结构输出，丢掉任何一条都等于让 AI 从头再犯一次错：

- **任务目标** —— 最终要达成什么、目前完成到哪
- **关键事实** —— 数字、坐标、物品 ID、玩家名、openid、命令原文逐字保留
- **已执行的操作** —— 执行过的命令与结果，命令原样写出
- **决策与理由** —— 取舍原因，以及用户明确的偏好与禁止事项
- **待办与未解决问题**
- **踩过的坑** —— 失败的尝试与「不要再这么做」的结论
- **实体对照** —— openid / QQ 昵称 / MC 玩家名 / group_openid 的对应关系

摘要会作为一条消息插在 system 提示之后、最近的消息之前；如果压缩后仍超出目标 token 数，会在日志里提示可以调小保留条数或调大目标。

::: note

`/压缩` 需要当前用户在本群有会话上下文，且没有正在等待审批的操作。

:::

## 注意事项

- AI Agent 仅管理员可用
- 建议在 `manual` 模式下使用，避免 AI 误操作
- AI 的回复会自动分割为多条消息（每条最长 3000 字符）
- 支持推理模型（reasoning model），会自动提取思考过程
- `run_command` 工具受配置文件 `command-blacklist` 黑名单限制，斜杠、`bukkit:` 命名空间前缀与平台别名都会按同一规则匹配，`/execute … run` 会检查真实命令
