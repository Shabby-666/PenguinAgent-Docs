---
pageLayout: home
config:
  - type: doc-hero
    hero:
      name: HuHoBotPenguin
      tagline: 无需 QQ 第三方客户端 · 扫码即用
      text: 基于 PenguinClient 的增强分支，新增绑定系统、AI Agent、WebUI 管理面板等功能。
      image: /img/hero.webp
      actions:
        - theme: brand
          text: 快速开始
          link: /QuickStart/
        - theme: alt
          text: 命令列表
          link: /command.html
        - theme: alt
          text: GitHub
          link: https://github.com/HuHoBot/PenguinAgent
  - type: features
    title: 核心特性
    features:
      - icon: 🔐
        title: 账号安全
        details: 无 QQ 第三方客户端依赖，不需要实体 QQ 号，零风控。
      - icon: ⚡
        title: 即装即用
        details: 未配置凭据时扫码登录，二维码在控制台与网页共用同一次授权任务。
      - icon: 🔗
        title: QQ 绑定系统
        details: 以 openid 为准跨群通用，自动同步白名单，支持强制绑定与免验证名单。
      - icon: 🤖
        title: AI Agent 管理助手
        details: 在 QQ 群里查插件、执行命令、读日志、管理群设置，支持人工审批模式。
      - icon: 🖥️
        title: WebUI 管理面板
        details: 19 个配置分区，状态面板、扫码入口、附属插件中心与表单编辑。
      - icon: 🎨
        title: MiniMessage 颜色
        details: 群→游戏消息支持 <gold>、<#FFAA00> 与渐变，兼容旧式 &6 / §6。
      - icon: 🔔
        title: 服务器状态通知
        details: 关机、重启、意外关闭时自动提醒 QQ 群，消息可自定义。
      - icon: 🧩
        title: 脚本扩展
        details: 用 JavaScript / Lua / Python 写脚本插件，不用编译，随时重载。
  - type: custom
---

## 核心优势

| 特性 | 传统方案 | HuHoBotPenguin |
|--------|------------------|-------------------|
| 账号安全 | 需要实体QQ号，存在封号风险 | 无QQ第三方客户端依赖，零风控 |
| 部署复杂度 | 需搭建完整机器人框架 | 即装即用，一键绑定 |
| 服务器兼容性 | 部分面板服不支持 | 全平台兼容，有网即用 |
| 协议更新影响 | 需要频繁适配新协议 | 协议无关设计，相对稳定 |
| 主动消息 | 普通机器人不支持 | 支持全量主动消息 |
| Markdown 界面 | 普通机器人不支持 | 支持 Markdown 消息 |

## 新增功能（相比上游）

### 扫码登录（控制台 / 网页）

未配置 AppID/Secret 时会自动开启扫码授权，二维码在**控制台和网页共用同一次授权任务**，任一端扫码成功或取消，另一端状态同步。

- 控制台：启动时打印二维码，手机 QQ 扫码后自动写入 `config.yml`
- 网页：打开 WebUI「QQ 机器人」页点「打开扫码连接」，不用再调终端窗口大小
- 二维码过期会自动刷新；未配置凭据时 WebUI 照常启动，服务器不会卡在启动阶段

### 玩家事件播报

玩家进服、退服、死亡时自动发到 QQ 群，可在 WebUI「玩家事件」页逐项开关。

死亡播报里的 `{message}` 是**自动生成的中文死亡描述**，不是游戏原版英文，例如「Steve 被苦力怕杀死了」「Steve 从高处摔落而死」，覆盖玩家 / 生物 / 投射物击杀与摔落、岩浆、火烧、溺水和窒息、虚空、闪电、爆炸、中毒、饿死等 14 种死法。

### QQ 绑定系统

通过 `/绑定` 命令将 QQ 账号与 Minecraft 玩家绑定，支持：

- **跨群通用**：绑定以 openid 为准，在一个群绑定后本服务器所有群都通用，MC 玩家名全局唯一
- 自动白名单同步（绑定时添加，解绑时移除）
- 游戏内验证码确认（默认开启）
- 双向昵称显示（MC 显示名称 / QQ 显示名称）
- 游戏内 `/at` 命令发送 QQ @提醒
- **解绑二次确认**：发确认键盘，30 秒内未选择视为取消

详细文档：[绑定系统](Binding/index.md)

### 强制绑定

开启后未绑定的玩家一进服务器就会被踢出，并拿到一个 5 位验证码；在 QQ 群执行 `/绑定 <验证码>` 完成绑定后重新进入即可游玩。解绑后下次进服同样被踢出，若该玩家当前在线会被立即断开。

适合用来替代白名单做准入控制。**开启前不要安装任何白名单插件、也不要开启 Minecraft 自带白名单**，否则玩家会在白名单阶段先被拦下，拿不到验证码。QQ 机器人未连接时该开关会自动关闭。

详见[绑定系统](Binding/index.md)

### AI Agent 管理助手

通过 `/agent` 命令启动 AI 会话，可执行：

- 服务器管理：查插件列表、查命令帮助、执行命令、读日志
- QQ群管理：审批入群、禁言、自动审批策略
- SKILL 系统：按需加载 Minecraft 命令语法文档
- 两种执行模式：自动执行 / 人工审批

详细文档：[AI Agent](Agent/index.md)

### 服务器状态通知

服务器**正常关闭、重启完成、意外关闭**时自动往 QQ 群发提醒，不用再盯控制台：

- 关机通知在服务器停止的瞬间立即发送，抢在 QQ 连接关闭之前
- 重启与意外关闭只能在下次启动时判断（插件视角下关服和重启长得一样），因此会在机器人连上 QQ 后补发
- 三项通知各自独立开关、独立消息文本，支持 `{server}`、`{platform}` 占位符
- `restart-window` 控制「多久之内又起来」算重启，默认 180 秒
- 插件重载 / 手动停用不会被误判成关服或重启

详细文档：[服务器状态通知](Notify/index.md)

### 消息颜色（MiniMessage）

群 → 游戏的消息支持 MiniMessage 写法，和旧式颜色码混用无冲突：

```yaml
chat-format:
  from-group: "<gold>[QQ]</gold> <#FFAA00>{name}</#FFAA00>: {message}"
```

- 命名色、十六进制色、`<bold>` / `<italic>`、`<gradient>` 渐变
- 旧式 `&6` / `§6` 依旧可用，十六进制输出 `§x§R§R§G§G§B§B`（需服务端 1.18+）
- 群成员的昵称与消息内容会自动转义，发一句 `<red>` 不会把后面的聊天染色

详细文档：[消息格式与颜色](Message/index.md)

### WebUI 管理面板

启动时生成密码，浏览器访问即可管理（默认端口 5678，可在 config.yml 中修改 `webui-port`）：

- 19 个配置分区（Bot、服务器、玩家事件、服务器状态通知、绑定、Agent、自定义命令、命令黑名单等），每页都有手写的用途说明
- 状态面板：平台、版本、连接状态、在线玩家、绑定群列表
- 扫码连接入口（见上文）
- 附属插件中心：搜索、下载安装、删除已下载插件
- 表单编辑：文本、开关、标签列表、命令面板编辑器、自定义命令编辑器

### 脚本扩展（Spigot / Paper）

- **不用编译也能扩展**：用 JavaScript、Lua 或 Python 写脚本插件，放进 `plugins/HuHoBotPenguin/addons/<名字>/` 即可
- **`Bird` 桥**：脚本可注册 Bukkit 事件、游戏内命令、定时任务、HTTP 回调和 QQ 群指令
- **目录式插件**：一个目录一个插件，带 `metadata.yaml` 元数据、配置声明和数据目录
- **可随时重载**：`/huhobot scripts reload` 撤销并重新加载，重载和加载失败都会清干净已登记的内容
- **引擎按需安装**：Lua 随主插件附带；GraalJS（约 34 MB）和 GraalPy（约 125 MB）是独立 jar，放在 `plugins/HuHoBotPenguin/engines/`，不放也能启动

详见 [脚本扩展开发](develop/script-addon.md)

### 其他增强

- **动态 `/帮助`**：自动列出所有内置命令、自定义命令和扩展命令，按 command key 去重
- **扩展系统**：第三方插件可通过 `registerAddon` + `registerBotCommand` 注册扩展命令，自动出现在 `/帮助` 和 `/addons` 中
- **自定义命令占位符**：`{name}`（绑定MC名）、`{nickname}`（QQ昵称）
- **命令黑名单**：禁止通过 `/执行` 或 Agent 运行指定服务器命令（如 `op`、`deop`），斜杠与 `bukkit:` 前缀会被忽略，平台支持时别名（`/pl` ↔ `/plugins`）一并拦截，`/execute … run` 会检查真实命令
- **服务器状态通知**：关机 / 重启 / 意外关闭时推送 QQ 群，见[服务器状态通知](Notify/index.md)
- **MiniMessage 颜色**：群→游戏消息支持 `<gold>`、`<#FFAA00>`、渐变等写法，见[消息格式与颜色](Message/index.md)
- **在线列表模板**：`Markdown/online.md` 自定义 `/查在线` 结果（模板文件名由 `markdown.queryOnline` 指定）
- **blockMotd / unblockMotd**：按群屏蔽 MOTD 查询
- **附件解析**：语音、图片、视频、文件自动转义
- **@提及高亮**：转发到游戏时在线玩家名蓝色高亮 + 提示音

## 快速开始

如何安装？请看 [快速开始](QuickStart/index.md)

## 命令列表

在群内输入 `@HuHoBot /帮助` 可快速查看命令列表。

完整命令列表：[命令列表](command.md)

## QQ 交流群

群号：1103399514 [点我加入](https://qm.qq.com/q/5sq0Mf6IdW)

## 开源协议

[GNU Affero General Public License v3.0](/LICENSE.txt) - 自由使用、修改和分发，但需遵守以下条款：

- **开源义务**：任何衍生作品必须保持开源
- **相同许可**：修改后的版本必须使用相同许可证
- **版权声明**：必须保留原始版权声明
- **网络服务**：通过网络提供服务时，必须向用户提供源代码

完整协议文本请查看 [LICENSE](/LICENSE.txt) 文件

### 第三方资源

脚本扩展系统（`addons/<名字>/main.js` / `main.lua` / `main.py` 与 `Bird` 桥）借鉴并移植自
[birdlibraryapi](https://github.com/prach1121/birdlibraryapi)（Apache-2.0），原作者 prach1121。
`Bird` 对象（`BirdScriptApi`）由该项目的 `BirdAPI` 移植而来，并按 Spigot 1.16+（不使用 Adventure API）
与 HuHoBot 附属插件注册做了适配；脚本的加载与生命周期设计也参考了它。源码文件头部保留了原始出处与许可证声明。

背包查看功能使用 [Faithful 32x](https://faithfulpack.net/) 贴图包，遵循 [Faithful License v3](https://faithfulpack.net/page/licenses)。

## 已知限制

| 限制 | 说明 |
|---|---|
| 背包查看 - 离线玩家 | 仅支持查看在线玩家背包，离线玩家无法查看 |
| 背包查看 - 贴图覆盖 | Faithful 32x 未覆盖所有方块/物品，部分显示为 `unknown.png`（铁砧、箱子、漏斗、床、旗帜、潜影盒、头颅等） |
| 背包查看 - 动画贴图 | 动画贴图（如命令方块）仅渲染第一帧 |
| 背包查看 - 皮肤渲染 | 玩家皮肤为 2D 正面视图，不支持 3D 旋转 |
| 状态通知 - 崩溃补发 | 崩溃/断电通知只能在下次启动时补发，进程已死无法即时发送 |
| 状态通知 - 平台范围 | 目前仅 Spigot / Paper 实现，其他平台待适配 |
| 消息颜色 - 方向限制 | 只有群→游戏解析颜色，发往 QQ 的消息（游戏→群、进退服、死亡播报）原文直出 |
| 消息颜色 - 十六进制 | `§x§R§R§G§G§B§B` 形式需要服务端 1.18 及以上 |
| 非 Spigot 平台 | Nukkit、Velocity、BungeeCord、Allay 适配待完成 |
