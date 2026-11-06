# HuHoBotPenguin 部署与配置教程

在使用 HuHoBotPenguin 前，需要完成 QQ 开放平台机器人的创建与申请：

1. 访问 [QQ 开放平台官网](https://q.qq.com)
2. 登录并创建/申请一个机器人。
3. 在配置时，连接方式请选择 **"其他方式连接"**。
4. 记录 Bot 的 `app-id` 与 `secret` 密钥，供后续配置使用。

## 快速开始（扫码登录）

首次启动时，若未配置 `app-id` 和 `secret`，控制台会自动打印二维码。使用手机 QQ 扫码即可自动完成机器人绑定，无需手动编辑配置文件。

```
========== QQ Bot 扫码登录 ==========
首次启动未检测到 bot.app-id / bot.secret
请使用手机 QQ 扫描以下二维码完成机器人绑定

  ██████████████████████████████████
  ██ ▄▄▄▄▄ █▀▄█▀▀▄ █▄▄▄▄▄ █
  ...
扫码链接: https://q.qq.com/qqbot/openclaw/connect.html?task_id=xxx&source=openclaw&_wv=2
（扫码后自动继续，过期会自动刷新）
```

扫码成功后，`app-id` 和 `secret` 会自动写入 `config.yml`，机器人随即启动。

## 手动配置

打开插件的 `config.yml` 配置文件，按照如下结构配置 Bot 基础信息并绑定群聊。

::: tip 配置版本

当前配置版本为 **12**。升级插件后启动时会自动补齐新增配置项并写回注释，不需要重新生成 `config.yml`；手动改过的值会被保留。

:::

### Bot 基础信息与群聊绑定

```yaml
bot:
  app-id: "_AppID"
  secret: "Your_Secret"
  name: HuHoBot
  groups:
    - "66535AF0D529..."
    - "DFD5BB8CBA5C..."
```

**配置要点说明：**

- **群号填写：** 在群聊中发送 `/查信息` 获取当前群的 OpenId，并将获取到的群号依次填入 `groups` 表中。
- **群号规范：** 填入 `groups` 列表中的群号时，务必加上双引号（例如：`"66535AF0D529..."`）。
- **隐藏日志：** `suppress-console-output: true` 可屏蔽 QQ Bot SDK 的调试输出。

### 消息互通格式

```yaml
chat-format:
  from-game: "[游戏] {name}: {message}"
  from-group: "[QQ] {name}: {message}"
  post-chat: true
  start-with: "#"
```

- `from-game`：游戏消息转发到 QQ 群的格式
- `from-group`：QQ 群消息转发到游戏的格式
- `post-chat: true`：开启群→游戏转发
- `start-with: "#"`：只有以 `#` 开头的游戏消息才转发到 QQ（留空表示全部转发）

`from-group` 支持 MiniMessage 颜色，与旧式颜色码可混用；`from-game` 发往 QQ，不解析颜色：

```yaml
chat-format:
  from-group: "<gold>[QQ]</gold> <#FFAA00>{name}</#FFAA00>: {message}"
  # 或者沿用旧写法
  # from-group: "&6[QQ] &e{name}&r: {message}"
```

群成员的昵称和消息内容会被自动转义，发 `<red>` 不会把后面的聊天染色。完整说明见[消息格式与颜色](../Message/index.md)。

### 玩家事件通知

```yaml
player-events:
  join:
    enabled: true
    format: "[游戏] {name} 加入了服务器"
  quit:
    enabled: true
    format: "[游戏] {name} 离开了服务器"
  death:
    enabled: true
    format: "[游戏] {message}"
```

- 进服/退服格式可用占位符：`{name}`、`{player}`、`{server}`、`{platform}`
- 死亡播报的 `{message}` 是自动生成的中文死亡描述（如「Steve 被苦力怕杀死了」），另有 `{killer}` 击杀者占位符
- `player-events.always-forward`：忽略平台事件的隐藏/取消/登录状态判断，始终转发进退服事件
- 这三类通知都发往 QQ，因此不解析 MiniMessage 与 `§` 颜色码，格式里的颜色写法会原样显示

### 服务器状态通知

服务器关机、重启、意外关闭时往 QQ 群推送提醒（v1.20.0 起，仅 Spigot / Paper）：

```yaml
server-notify:
  enabled: true                      # 总开关
  shutdown:
    enabled: true
    message: "服务器已正常关闭"       # 可用占位符：{server}、{platform}
  restart:
    enabled: true
    message: "服务器已重启完成"
  crash:
    enabled: true
    message: "服务器意外关闭（崩溃或被强制结束），请管理员检查控制台"
  restart-window: 180                # 多少秒内重新启动算一次重启，建议 120-300
```

- 关机通知在服务器停止的瞬间立即发送
- 重启与意外关闭只能在**下次启动**时判断，因此会在机器人连上 QQ 后补发
- 插件重载 / 手动停用不会被当成关服，也不会被当成一次重启
- 判定依赖数据目录下的 `server-notify-state.properties`，不要手动删除

时机、状态文件与排查细节见[服务器状态通知](../Notify/index.md)。

## 绑定系统配置

绑定系统允许 QQ 用户与 Minecraft 玩家名绑定，支持自动白名单同步。

```yaml
binding:
  # 绑定时是否需要游戏内 /qqbind 验证；关闭时直接绑定无需游戏内操作
  require-game-verification: true
  # 强制绑定：未绑定玩家进服即被踢出并拿到 5 位验证码，须在 QQ 群 /绑定 <验证码>
  force-bind: false
  # 强制绑定提示里展示的 QQ 群号，可填多个；留空则不提示
  force-bind-groups: []
  # 免验证名单：这些玩家无需 QQ 绑定即可进入服务器
  verify-exempt: []
```

- `require-game-verification: true`（默认）：需要玩家进入服务器执行 `/qqbind <验证码>` 确认
- `require-game-verification: false`：直接绑定，自动添加白名单
- `force-bind`：强制绑定，**开启前请勿叠加任何白名单插件或 Minecraft 自带白名单**，否则玩家会在白名单阶段被拦下、拿不到验证码
- `verify-exempt`：受限于设备或环境无法使用 QQ 的人员，管理员人工审查后加入（也可在群里用 `/添加免验证 <玩家名>`）

详见[绑定系统](../Binding/index.md)。

### 白名单同步

```yaml
whitelist:
  add-command: "whitelist add {name}"
  del-command: "whitelist remove {name}"
```

绑定/解绑时自动执行白名单命令，`{name}` 会被替换为玩家名。

## AI Agent 配置

AI Agent 让管理员通过 QQ 群直接管理服务器（执行命令、查日志、管理插件等）。

::: note 管理员权限

所有 AI Agent 命令（`/agent`、`/newsession`、`/stop`、`/压缩`、`/压缩token`、`/压缩保留`、`/删除信息`）仅管理员可用。

:::

```yaml
agent:
  enabled: false
  base-url: ""
  api-key: ""
  model: "gpt-4o-mini"
  # auto: 自动执行命令
  # manual: 执行前需管理员审批（默认）
  command-mode: "manual"
  # 获取类工具（插件列表/命令帮助/日志）结果只交给 AI，不在群里发卡片
  hide-fetch-results: true
  # 深度思考（原生推理模型用）与思考引导（非推理模型用）互斥，二选一
  think: false
  think-visibility: "log"
  think-param: "reasoning_effort"
  think-level: ""
  think-guide: false
  # 上下文压缩
  context:
    compress:
      target: 4000
      keep: 20
    truncate:
      drop: 10
```

- `enabled`：启用 AI Agent 功能
- `base-url` / `api-key` / `model`：OpenAI 兼容的 Chat Completions 接口地址、密钥与模型名
- `command-mode`：`auto`（AI 直接执行）或 `manual`（管理员审批后执行）
- `hide-fetch-results`：获取类工具（插件列表/命令帮助/服务器日志）结果只交给 AI，不在群里发卡片
- 深度思考 / 思考引导：两种让模型"思考"的方式，**互斥**，按模型能力二选一，详见 [AI Agent](../Agent/index.md#深度思考)
- `context`：对话历史按 token 计量，`compress.target` / `compress.keep` 可被 `/压缩token`、`/压缩保留` 覆盖

详细文档请查看 [AI Agent](../Agent/index.md)。

## MOTD API 与在线查询配置

### MOTD API 启用配置

若要启用服务器状态及 MOTD 展示，需要在配置中定位到 `motd` 字段下的 `api` 项，并将其值换为标准 API 接口：

```yaml
motd:
  server-ip: "127.0.0.1"
  server-port: 25565
  api: "http://motd.txssb.cn/api/app_img?ip={ip}&port={port}&dark=true&lang=zh-CN"
  text: "共{online}人在线"
  post-img: true
  use-markdown: true
```

**参数与规则说明：**

- **保留占位符**：URL 中的 `{ip}` 和 `{port}` 必须保持原样，**不可变动**。
- **主题配色调节：**
  - `dark`：深色模式
  - `dark=false`：浅色

**详细文档与调试**：参考[官方文档](https://motd.txssb.cn/docs)，或使用其提供的在线测试器测试对应的 URL。

- **兼容性限制：** 暂不支持 **Simpfun (简幻欢)** 节点的状态查询。

### 在线查询 Markdown 权限说明

使用 `/查在线` 时，`use-markdown` 与 `post-img` 默认为 `true`（Markdown 卡片 + 服务器状态图）。如需纯文本可把 `use-markdown` 设为 `false`，不想要图片可把 `post-img` 设为 `false`。自定义卡片的模板文件由 `markdown.queryOnline` 指定（默认 `Markdown/online.md`），详见[在线列表配置](../OnlineList.md)。

## 管理员配置

```yaml
admin:
  # qq: 仅群主/QQ 群管理员；config: 仅手动名单；both: 任一满足
  mode: both
  openids: []
```

- `mode: qq`：仅 QQ 群主/管理员
- `mode: config`：仅 `openids` 列表中的用户
- `mode: both`：任一满足即可

也可在群内使用 `/管理方式` 命令实时切换。

## 自定义命令配置

```yaml
custom-commands:
  - key: "公告"
    command: "say {params}"
    permission: 0
    push-menu: true
```

- `key`：命令关键词（`/执行 公告 ...`）
- `command`：发送到服务器的实际命令，支持占位符
- `permission`：0 = 所有人，1 = 仅管理员
- `push-menu`：是否同步到 QQ 指令面板

占位符详见 [命令列表](../command.md#自定义命令)。

## 命令黑名单

禁止通过 `/执行` 或 Agent `run_command` 工具运行指定的服务器命令：

```yaml
command-blacklist:
  - "op"
  - "deop"
```

- 匹配命令的第一个词（如填 `op` 则禁止 `/执行 op someone`）
- 不区分大小写
- 默认为空（不禁止任何命令）
- 同时作用于 `/执行` 命令和 AI Agent 的 `run_command` 工具
- 匹配前会做与服务器相同的规范化：斜杠、`bukkit:` / `minecraft:` 等命名空间前缀都会被忽略，`/plugins`、`bukkit:plugins` 都会被 `plugins` 拦下
- 平台能拿到命令表时，原版别名也会一并拦截 —— 黑名单里写 `plugins`，`/执行 pl` 同样跑不了
- `/execute as @a run op Steve` 这类包装写法会检查 `run` 后面的真实命令，最多递归 4 层

## 命令开关

```yaml
commands:
  查信息: true
  查管理: true
  加管理: true
  # ... 其他命令
  agent: true
```

将对应命令设为 `false` 可禁用该命令。

## 敏感词审核（可选）

```yaml
audit:
  base-url: ""
  api-key: ""
  model: "gpt-4o-mini"
```

配置后，消息会先经本地 `sensitive-words/*.txt` 过滤，命中后再调用 OpenAI 兼容接口二审。

## 其它常用配置

```yaml
# 服务器显示名，用于 {server} 占位符
serverName: "HuHoBot"
# WebUI 端口，修改后需重启
webui-port: 5678
# 命令执行收集模式：Hybrid=同时收集命令发送者输出与服务端日志
command-sender: "Hybrid"

bot:
  # 收到陌生群消息时自动把群 OpenID 追加到 groups
  auto-add-groups: true

features:
  # 是否默认开启全量聊天转发
  full-amount: false
  # 是否启用 QQ 头像认证
  enable-auth: true

# 命中正则的消息片段替换为 *
filter-regex: []

command-panel:
  # 只在 QQ 面板里决定是否给所有人显示管理员命令，执行时仍验证权限
  show-admin-commands: true

markdown:
  # /查在线 使用的 Markdown 模板文件名（位于 Markdown/ 目录）
  queryOnline: "online.md"

inventory:
  render:
    custom-background:
      # 用自定义背包底图（放在 inventory/backgrounds/）
      enabled: false
      inventory-file: "inventory.png"
      ender-chest-file: ""
      fit: "cover"   # cover 裁切填满 / stretch 拉伸填满

update-check:
  enabled: true
  # 自定义更新数据源（逗号分隔），留空用内置
  url: ""

placeholder-api:
  # 安装 PlaceholderAPI 后解析配置里的 %占位符%
  enabled: true
```

- `serverName`：出现在进服/退服/死亡播报的 `{server}` 占位符里
- `webui-port`：WebUI 端口，改完需重启
- `command-sender`：`Hybrid` 同时收集命令发送者输出与服务端日志
- `features.full-amount`：是否默认把群消息全量转发到游戏
- `features.enable-auth`：是否启用 QQ 头像认证
- `filter-regex`：命中正则的消息片段会被替换成 `*`
- `command-panel.show-admin-commands`：只影响 QQ 面板可见性，执行时仍严格验证管理员权限
- `markdown.queryOnline`：`/查在线` 使用的 Markdown 模板文件名
- `inventory.render.custom-background`：自定义背包 / 末影箱底图
- `update-check`：启动与 `/版本` 时的版本更新检查
- `placeholder-api`：安装 PlaceholderAPI 后解析配置里的 `%占位符%`

::: note

以上配置项都能在 WebUI 对应的分区里图形化编辑，不必手改 YAML。

:::

## WebUI 管理面板

插件启动时会在控制台输出 WebUI 地址和密码。浏览器访问即可通过图形界面管理所有配置项，无需手动编辑 YAML 文件。
