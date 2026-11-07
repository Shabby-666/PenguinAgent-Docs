# 在线列表配置

`/查在线 [页码]` 用于在群内查询服务器当前在线玩家。

- **Spigot / Paper（默认）**：使用本地渲染的在线列表图片（雾蓝玻璃主题、玩家皮肤头像、管理员置顶、分页），由 `online-list.*` 控制。
- **其他平台 / 关闭本地渲染 / 渲染失败**：回退到 `motd` + `markdown` 的原有图片/Markdown 逻辑。

## 本地渲染（Spigot / Paper，推荐）

```yaml
online-list:
  enabled: true                # 关闭后回退到 MOTD 外部图片 / Markdown
  page-size: 27                # 每页玩家数，三列布局推荐 27
  admin-first: true            # 管理员置顶
  admin-permission: ""         # 留空只看 OP
  cooldown-seconds: 3          # 同群最小请求间隔
  skin:
    enabled: true              # 下载并显示皮肤头像
    connect-timeout-ms: 3000
    read-timeout-ms: 5000
    cache-size: 200
    download-threads: 4
  render:
    columns: 3
    font-family: ""            # 留空自动检测
    footer-text: "POWERED BY HuHoBot"
  image-max-bytes: 20971520
```

用法：`/查在线 1`、`/查在线 2`。玩家快照在主线程采集，皮肤下载与 PNG 渲染在后台完成。底图资源打包在插件 jar 内；渲染器初始化失败时自动回退。

## MOTD / Markdown 回退模式

当未使用本地渲染时，`/查在线` 由 `motd` 与 `markdown` 控制：

```yaml
motd:
  server-ip: "127.0.0.1"
  server-port: 25565
  # /查在线 回退时使用的图片接口（支持 {ip}、{port} 占位符）
  api: ""
  text: "共{online}人在线"
  post-img: true
  use-markdown: true

markdown:
  queryOnline: "online.md"
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `motd.server-ip` / `server-port` | 字符串/数字 | `/查在线` 回退探测与图片占位符使用的地址 |
| `motd.api` | 字符串 | `/查在线` 回退图片接口，支持 `{ip}`、`{port}`；留空使用内置默认接口 |
| `motd.text` | 字符串 | 纯文本模式模板：`{online}` 在线人数，`{players}` 玩家列表 |
| `motd.post-img` | 布尔 | 纯文本/回退模式是否附带图片 |
| `motd.use-markdown` | 布尔 | 回退模式是否使用 Markdown 卡片 |
| `markdown.queryOnline` | 字符串 | Markdown 模板文件名（位于 `Markdown/`） |

::: tip

`/motd` 命令现在直接使用 `motd.txssb.cn` 的状态与图片接口，不再读取 `motd.api`。`motd.api` 主要影响 `/查在线` 的回退图片地址。

:::

## Markdown 模式（回退）

`motd.use-markdown: true` 时，回退模式会读取 `Markdown/` 下的模板（默认 `online.md`）。模板缺失会提示「未找到 Markdown 模板：queryOnline」。

## 纯文本模式（回退）

```yaml
motd:
  use-markdown: false
  text: "共{online}人在线\n{players}"
```

## 自定义 online.md

编辑 `plugins/HuHoBotPenguin/Markdown/online.md`（文件名由 `markdown.queryOnline` 指定）。

### 可用变量

<!-- v-pre：这些是 HuHoBot 自己的模板占位符，不能被 Vue 当作插值表达式解析 -->
<div v-pre>

| 变量 | 说明 |
| --- | --- |
| `{{.server}}` | 服务器名称（`serverName`） |
| `{{.img_url}}` | MOTD 图片链接 |
| `{{.online_num}}` | 当前在线人数 |
| `{{.player}}` | 在线玩家列表（编号 + 加粗） |

</div>

## 故障排查

- **本地渲染失败/不生效**：检查 `online-list.enabled`、服务端是否 Spigot/Paper、控制台是否有渲染器初始化错误；失败时会回退 MOTD/Markdown。
- **回退模式没显示自定义内容**：检查 `motd.use-markdown`、`Markdown/<queryOnline>` 是否存在、文件名是否正确。
- **按群屏蔽查询**：管理员可用 `/blockMotd` 屏蔽本群 MOTD 查询，`/unblockMotd` 解除。
