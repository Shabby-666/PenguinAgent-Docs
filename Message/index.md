# 消息格式与颜色

HuHoBotPenguin 有三条独立的消息链路，每条链路的占位符和颜色处理都不一样。改格式前先确认自己在改哪一条，否则很容易出现「加了 `<gold>` 却没变色」。

## 三个消息方向

| 方向 | 配置键 | 最终去处 | 颜色处理 |
|---|---|---|---|
| 游戏 → QQ | `chat-format.from-game` | QQ 群 | **不解析**颜色，原文直出 |
| QQ → 游戏 | `chat-format.from-group` | 游戏聊天栏 | MiniMessage、`&6`、`§6` 全部转成 `§` 码 |
| 进退服通知 | `player-events.join/quit.format` | QQ 群 | **不解析**颜色，原文直出 |
| 死亡播报 | `player-events.death.format` | QQ 群 | **不解析**颜色，原文直出 |

发到 QQ 的三条链路之所以不做转换，是因为 QQ 不识别 Minecraft 的 `§` 颜色码 —— 转换了也只会在群里显示成一串乱码。想让群消息有样式，请用 QQ 侧的 Markdown 卡片（见[在线列表配置](../OnlineList.md)）。

## 占位符

### 游戏 → QQ（`from-game`）

| 占位符 | 含义 |
|---|---|
| `{name}` | 玩家名 |
| `{message}` / `{msg}` | 消息内容（已过敏感词过滤） |

### QQ → 游戏（`from-group`）

| 占位符 | 含义 |
|---|---|
| `{name}` / `{nick}` | 发送者昵称（绑定后默认仍是 QQ 名，可用 `/MC显示名称` 切换） |
| `{message}` / `{msg}` | 消息内容（已过敏感词过滤） |

### 进退服 / 死亡播报（`player-events.*.format`）

| 占位符 | 可用范围 | 含义 |
|---|---|---|
| `{name}` / `{player}` | 全部 | 玩家名 |
| `{server}` | 全部 | `serverName` 配置的服务器显示名 |
| `{platform}` | 全部 | 平台名（如 `Spigot`） |
| `{message}` | 仅死亡播报 | 自动生成的中文死亡描述，如「Steve 被苦力怕杀死了」 |
| `{killer}` | 仅死亡播报 | 击杀者名；环境死亡时填「未知」 |

安装 PlaceholderAPI 且开启 `placeholder-api.enabled` 后，进退服与死亡播报里还可以写 `%占位符%`，由 PlaceholderAPI 解析。

## 群 → 游戏的颜色写法

`chat-format.from-group` 同时支持两种写法，可以混用。

### MiniMessage（推荐）

```yaml
chat-format:
  from-group: "<gold>[QQ]</gold> <#FFAA00>{name}</#FFAA00>: <white>{message}</white>"
```

| 写法 | 效果 |
|---|---|
| `<gold>` `<red>` `<aqua>` … | 16 种命名颜色 |
| `<#FFAA00>` | 十六进制颜色 |
| `<bold>` `<italic>` `<underlined>` `<strikethrough>` `<obfuscated>` | 装饰格式 |
| `<gradient:#FF0000:#00FF00>` | 渐变色 |
| `</gold>` | 结束标签，恢复默认样式 |
| `\<` | 转义尖括号，输出字面量 `<` |

> 十六进制颜色会输出成 `§x§R§R§G§G§B§B` 形式，需要**服务端 1.18 及以上**。更低版本会被降级成最接近的命名颜色。

### 旧式颜色码

```yaml
chat-format:
  from-group: "&6[QQ] &e{name}&r: {message}"
```

`&` 与 `§` 两种写法都认，`&r` 重置样式。和 MiniMessage 混用时，`§` 码会被原样保留，不会被当作非法标签吞掉。

## 用户内容会被转义

`{name}` 和 `{message}` 来自群成员，填入模板前会先转义 MiniMessage 标签：

```text
群成员发：<red>你好
游戏里看到：<red>你好        ← 字面量，不是红色文字
```

不转义的话，任何人发一句 `<red>` 就能把后面所有人的聊天全部染色。只有**配置文件里手写的标签**才会被解析。

## 常见问题

| 现象 | 原因 | 处理 |
|---|---|---|
| 写了 `<gold>` 没变色 | 改的是 `from-game` 或玩家事件格式 | 这三条链路发往 QQ，不解析颜色 |
| 十六进制颜色变成命名色 | 服务端低于 1.18 | 升级服务端，或改用命名颜色 |
| 群消息里 `<` 后面的字消失 | 标签写法非法 | 用 `\<` 转义，或检查标签是否闭合 |
| 群成员发的 `<red>` 变成了红色 | 用了旧版本 | v1.20.0 起已自动转义用户内容 |
| 群消息里出现 `§6` 字样 | 在 QQ 侧写了 `§` 码 | QQ 不识别 `§`，群消息不要用 `§` |

## 相关配置

- `chat-format.*`：双向聊天转发格式，见[快速开始](../QuickStart/index.md#消息互通格式)
- `player-events.*`：进退服与死亡播报，见[快速开始](../QuickStart/index.md#玩家事件通知)
- `server-notify.*`：服务器状态通知的消息模板，见[服务器状态通知](../Notify/index.md)
