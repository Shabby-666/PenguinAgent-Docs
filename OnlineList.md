# 在线列表配置

`/查在线` 用于在群内查询服务器当前在线玩家。在线列表的内容与展示方式由 `motd` 与 `markdown` 两组配置控制，全部位于插件目录的 `config.yml`。

## 基础配置

```yaml
motd:
  # 实际探测在线状态用的服务器地址与端口
  server-ip: "127.0.0.1"
  server-port: 25565
  # MOTD 图片接口，支持 {ip} 与 {port} 占位符；留空使用内置默认接口
  api: "http://motd.txssb.cn/api/app_img?ip={ip}&port={port}&dark=true&lang=zh-CN"
  # 纯文本模式下的提示文本：{online}=在线人数，{players}=玩家列表
  text: "共{online}人在线"
  # 是否附带服务器状态图片
  post-img: true
  # 是否使用 Markdown 卡片（默认开启）
  use-markdown: true

markdown:
  # Markdown 模式使用的模板文件名（位于插件目录的 Markdown/ 下）
  queryOnline: "online.md"
```

## 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `motd.server-ip` | 字符串 | 用于探测在线状态的服务器地址 |
| `motd.server-port` | 数字 | 服务器端口，留空时取本服端口 |
| `motd.api` | 字符串 | MOTD 图片接口，支持 `{ip}` 与 `{port}` 占位符；留空用内置默认接口 |
| `motd.text` | 字符串 | 纯文本模式的提示文本，`{online}` 替换为在线人数、`{players}` 替换为玩家列表 |
| `motd.post-img` | 布尔 | 是否附带 MOTD 图片 |
| `motd.use-markdown` | 布尔 | 是否使用 Markdown 卡片 |
| `markdown.queryOnline` | 字符串 | Markdown 模式使用的模板文件名 |

::: tip 占位符

`motd.api` 里的 `{ip}`、`{port}` 必须保持原样，程序会替换成上面配置的地址与端口；请求时还会自动追加一个时间戳参数以避免图片缓存。

:::

## Markdown 模式（默认）

`motd.use-markdown: true`（默认）时，`/查在线` 会读取 `Markdown/` 目录下的模板文件（默认 `online.md`），把在线信息填进去后以 Markdown 卡片发送。模板文件不存在时会提示「未找到 Markdown 模板：queryOnline」。

## 纯文本模式

把 `motd.use-markdown` 设为 `false`，改用 `motd.text` 生成纯文本：

```yaml
motd:
  use-markdown: false
  text: "共{online}人在线\n{players}"
```

- `{online}`：在线人数
- `{players}`：在线玩家列表（每行一个）
- 若 `motd.post-img: true`，会连同 MOTD 图片一起发送

## 自定义 online.md

想附带公告、规则、群链接、服务器介绍等内容，编辑：

```text
plugins/HuHoBotPenguin/Markdown/online.md
```

模板文件名可在 `markdown.queryOnline` 里改，但文件必须放在 `Markdown/` 目录下。

## online.md 示例

下面是一个可以直接使用的 `online.md` 示例：

```markdown
# {{.server}}查在线结果

---

![Motd #700px #389px]({{.img_url}})

- **当前服内有**`{{.online_num}}`**位玩家**
- **名单如下:**

{{.player}}
```

保存后，下一次群内使用 `/查在线` 时，HuHoBot 会读取 `online.md`，并把文件内容作为自定义 Markdown 返回。

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

- 该 Markdown 需遵守 QQ 开放平台规则，出现链接、违禁词等会导致无法发送
- Markdown 规则可参考 [QQ 开放平台文档](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/type/markdown.html)
- 图片需要在 `[]` 内填写图片大小，如示例所示

## 故障排查

### 查询在线时没有自定义内容

请检查：

- `motd.use-markdown` 是否为 `true`
- `Markdown/` 目录下是否存在 `markdown.queryOnline` 指定的文件
- 文件名是否完全正确（如 `online.md`，不要写成 `online.md.txt`）
- 修改配置后是否已经重载或重启插件

### 控制台提示未找到 Markdown 模板

`/查在线` 会提示「未找到 Markdown 模板：queryOnline」，说明模板文件缺失或路径不对。补上文件，或把 `motd.use-markdown` 关掉改用纯文本模式。

### 按群屏蔽查在线

管理员可在群里用 `/blockMotd` 屏蔽本群的 MOTD 查询，用 `/unblockMotd` 解除。
