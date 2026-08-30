# Spigot/Paper 附属插件开发

本文介绍如何为 Spigot、Paper 或兼容 Bukkit API 的服务端编写 HuHoBotPenguin 附属插件。

## 环境准备

将 `HuHoBot-Penguin_Spigot-x.y.z.jar` 放到项目的 `libs` 目录：

```kotlin
dependencies {
    compileOnly(files("libs/HuHoBot-Penguin_Spigot-x.y.z.jar"))
    compileOnly("org.spigotmc:spigot-api:1.16.5-R0.1-SNAPSHOT")
}
```

`plugin.yml`：

```yaml
name: MyAddon
version: '1.0.0'
main: com.example.myaddon.MyAddon
api-version: '1.16'
depend:
  - HuHoBotPenguin
```

`depend` 保证 HuHoBotPenguin 先于附属插件加载。

## 获取主插件实例

```java
import cn.huohuas001.huhobotPenguin.spigot.HuHoBotSpigot;

HuHoBotSpigot bot = HuHoBotSpigot.getInstance();
```

Kotlin：

```kotlin
val bot = HuHoBotSpigot.getInstance()
```

---

## 扩展注册 API（v1.5.0+）

HuHoBotPenguin 提供扩展注册 API，让附属插件的命令自动出现在 `/帮助` 和 `/addons` 中。

### 注册扩展

**必须在注册命令之前调用**，否则命令无法归属到该扩展。

```java
// Java
boolean ok = bot.registerAddon(
    "MyAddon",          // 扩展名称（建议与 plugin.yml name 一致）
    "1.0.0",            // 版本号
    "我的附属插件",       // 描述
    "作者名"             // 作者
);
```

```kotlin
// Kotlin
val ok = bot.registerAddon(
    name = "MyAddon",
    version = "1.0.0",
    description = "我的附属插件",
    author = "作者名"
)
```

返回 `true` 表示注册成功。扩展名称不能为空。

### 注册命令（关联扩展）

注册命令并关联到已注册的扩展。命令会自动出现在 `/帮助` 的扩展分类和 `/addons` 列表中。

```java
// Java
boolean ok = bot.registerBotCommand(
    "MyAddon",              // 扩展名称（必须先 registerAddon）
    "hello",                // 命令 key（QQ 群中用 /执行 hello 或 /hello 触发）
    "say Hello {params}",   // 服务器命令模板
    0,                      // 权限：0=公开，>0=管理员
    true                    // 是否同步到 QQ 指令面板
);
```

```kotlin
// Kotlin
val ok = bot.registerBotCommand(
    addonName = "MyAddon",
    key = "hello",
    command = "say Hello {params}",
    permission = 0,
    pushMenu = true
)
```

返回 `false` 的情况：
- `addonName` 未注册（未调用 `registerAddon`）
- `key` 或 `command` 为空

### 旧 API（兼容）

不带 `addonName` 的注册方式仍然可用，但命令不会归属到任何扩展，仅出现在 `/帮助` 的自定义命令分类中：

```java
// 旧 API — 不关联扩展
bot.registerBotCommand("hello", "say Hello {params}", 0, true);
```

**建议新代码统一使用扩展 API**，以获得完整的 `/帮助` 和 `/addons` 支持。

### 注销命令

```java
bot.unregisterBotCommand("hello");
```

---

## 命令模板占位符

注册自定义命令时，支持以下占位符：

| 占位符 | 说明 |
|---|---|
| `{params}` | 完整参数字符串 |
| `{group}` | 群 OpenID |
| `{user}` | 用户 OpenID |
| `{name}` | 绑定的 MC 玩家名（未绑定则返回 QQ 用户名） |
| `{nickname}` | 用户的 QQ 昵称 |
| `{0}`、`{1}` ... | 按空格拆分后的第 N 个参数 |
| `&1`、`&2` ... | 按空格拆分后的第 N 个参数（另一种写法） |

示例：

```java
// 注册一个公告命令
bot.registerBotCommand(
    "MyAddon",
    "公告",
    "say 公告：{params}",
    0,
    true
);
// 用户执行 /执行 公告 服务器维护
// 实际执行服务器命令：say 公告：服务器维护
```

---

## 监听命令事件（OnBotCommand）

除了注册自定义命令模板，你还可以通过监听 `OnBotCommand` 事件来处理命令。这种方式适合需要自定义逻辑（如发图片、复杂判断）的场景。

### 注册命令 + 监听事件

```java
import cn.huohuas001.huhobotPenguin.spigot.events.OnBotCommand;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;

public class MyAddonListener implements Listener {

    public void onEnable() {
        // 1. 注册扩展
        bot.registerAddon("MyAddon", "1.0.0", "我的插件", "作者");

        // 2. 注册命令（占位符用空命令模板占位）
        bot.registerBotCommand("MyAddon", "在线列表", "noop", 0, true);

        // 3. 注册事件监听
        getServer().getPluginManager().registerEvents(this, this);
    }

    @EventHandler
    public void onBotCommand(OnBotCommand event) {
        // 匹配你的命令 key
        String key = event.getMessage().getCommandKey();
        if (!"在线列表".equals(key)) return;

        // 取消默认处理
        event.setCancelled(true);

        // 自定义处理逻辑
        String args = event.getMessage().getCommandArguments();
        String groupOpenId = event.getMessage().getGroupOpenId();

        // 回复消息
        event.replyText("当前在线玩家列表正在生成...");

        // 或回复 Markdown
        event.replyMarkdown("# 在线列表\n- 玩家A\n- 玩家B");
    }
}
```

### OnBotCommand 事件属性

| 属性/方法 | 说明 |
|---|---|
| `getMessage()` | 获取 `MsgPack` 消息对象 |
| `getMessage().getCommandKey()` | 命令 key |
| `getMessage().getCommandArguments()` | 命令参数 |
| `getMessage().getGroupOpenId()` | 群 OpenID |
| `getMessage().getMessageId()` | 消息 ID |
| `getMessage().getMessageSequence()` | 消息序号 |
| `replyText(String)` | 回复纯文本 |
| `replyMarkdown(String)` | 回复 Markdown |
| `replyMarkdown(String, Keyboard)` | 回复 Markdown + 按钮 |
| `setCancelled(true)` | 取消默认处理 |

---

## 监听群消息事件（OnBotRecvMsg）

监听所有群消息（不限于命令）：

```java
import cn.huohuas001.huhobotPenguin.spigot.events.OnBotRecvMsg;

@EventHandler
public void onBotRecvMsg(OnBotRecvMsg event) {
    String content = event.getMessage().getContent();
    String senderId = event.getMessage().getSenderId();
    String groupOpenId = event.getMessage().getGroupOpenId();

    // 处理消息...
}
```

---

## 发送消息

```java
// 发送到配置中的所有 QQ 群
bot.sendBotText("全局消息");
bot.sendBotMarkdown("# Markdown 消息");

// 发送到指定 QQ 群
bot.sendBotText(groupOpenId, "指定群消息");
bot.sendBotMarkdown(groupOpenId, "# Markdown");
```

返回值：指定群发送方法返回 `boolean`，`true` 表示成功。

---

## 查询认证 QQ 号

查询指定群中某个 OpenID 已绑定的 QQ 号；如果没有认证，返回 `null`：

```java
String qq = bot.getAuthenticatedQq(groupOpenId, openId);
if (qq == null) {
    // 当前 OpenID 未认证
} else {
    getLogger().info("已认证 QQ: " + qq);
}
```

---

## 完整示例

### Java 完整示例

```java
package com.example.myaddon;

import cn.huohuas001.huhobotPenguin.spigot.HuHoBotSpigot;
import cn.huohuas001.huhobotPenguin.spigot.events.OnBotCommand;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.plugin.java.JavaPlugin;

public class MyAddon extends JavaPlugin implements Listener {

    @Override
    public void onEnable() {
        HuHoBotSpigot bot = HuHoBotSpigot.getInstance();
        if (bot == null) {
            getLogger().severe("HuHoBotPenguin 未找到");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        // 1. 注册扩展
        bot.registerAddon(
            getName(),          // "MyAddon"
            getDescription().getVersion(),
            getDescription().getDescription(),
            getDescription().getAuthors().isEmpty() ? "" : getDescription().getAuthors().get(0)
        );

        // 2. 注册自定义命令模板
        bot.registerBotCommand(getName(), "ping", "say Pong!", 0, true);
        bot.registerBotCommand(getName(), "公告", "say 公告：{params}", 0, true);

        // 3. 注册需要自定义逻辑的命令（占位符占位）
        bot.registerBotCommand(getName(), "在线列表", "noop", 0, true);

        // 4. 注册事件监听
        getServer().getPluginManager().registerEvents(this, this);

        getLogger().info("MyAddon 已加载");
    }

    @EventHandler
    public void onBotCommand(OnBotCommand event) {
        String key = event.getMessage().getCommandKey();
        if (!"在线列表".equals(key)) return;

        event.setCancelled(true);

        // 自定义逻辑：生成在线列表图片
        String args = event.getMessage().getCommandArguments();
        int page = 1;
        try {
            if (!args.isEmpty()) page = Integer.parseInt(args.trim());
        } catch (NumberFormatException ignored) {}

        // 发送回复
        event.replyText("正在生成第 " + page + " 页在线列表...");
    }

    @Override
    public void onDisable() {
        HuHoBotSpigot bot = HuHoBotSpigot.getInstance();
        if (bot != null) {
            bot.unregisterBotCommand("在线列表");
        }
    }
}
```

### Kotlin 完整示例

```kotlin
package com.example.myaddon

import cn.huohuas001.huhobotPenguin.spigot.HuHoBotSpigot
import cn.huohuas001.huhobotPenguin.spigot.events.OnBotCommand
import org.bukkit.event.EventHandler
import org.bukkit.event.Listener
import org.bukkit.plugin.java.JavaPlugin

class MyAddon : JavaPlugin(), Listener {

    override fun onEnable() {
        val bot = HuHoBotSpigot.getInstance() ?: run {
            logger.severe("HuHoBotPenguin 未找到")
            server.pluginManager.disablePlugin(this)
            return
        }

        // 1. 注册扩展
        bot.registerAddon(
            name = name,
            version = description.version,
            description = description.description ?: "",
            author = description.authors.firstOrNull() ?: ""
        )

        // 2. 注册自定义命令模板
        bot.registerBotCommand(name, "ping", "say Pong!", 0, true)

        // 3. 注册需要自定义逻辑的命令
        bot.registerBotCommand(name, "在线列表", "noop", 0, true)

        // 4. 注册事件监听
        server.pluginManager.registerEvents(this, this)

        logger.info("MyAddon 已加载")
    }

    @EventHandler
    fun onBotCommand(event: OnBotCommand) {
        val key = event.message.commandKey
        if (key != "在线列表") return

        event.isCancelled = true
        event.replyText("在线列表生成中...")
    }

    override fun onDisable() {
        HuHoBotSpigot.getInstance()?.unregisterBotCommand("在线列表")
    }
}
```

---

## 方法一览

| 方法 | 说明 |
|---|---|
| `registerAddon(name, version, description, author)` | 注册扩展元数据，必须在命令注册前调用 |
| `registerBotCommand(addonName, key, command, permission, pushMenu)` | 注册命令并关联扩展（推荐） |
| `registerBotCommand(key, command, permission, pushMenu)` | 注册命令（旧 API，不关联扩展） |
| `unregisterBotCommand(key)` | 注销运行时命令 |
| `sendBotText(text)` | 发送文本到所有配置群 |
| `sendBotText(groupOpenId, text)` | 发送文本到指定群 |
| `sendBotMarkdown(markdown)` | 发送 Markdown 到所有配置群 |
| `sendBotMarkdown(groupOpenId, markdown)` | 发送 Markdown 到指定群 |
| `getAuthenticatedQq(groupOpenId, openId)` | 查询 OpenID 绑定的 QQ 号 |

## 注意事项

1. **加载顺序**：`plugin.yml` 中使用 `depend: [HuHoBotPenguin]` 确保主插件先加载
2. **线程安全**：事件在 Bukkit 主线程触发，不要在事件处理中执行同步网络请求
3. **注册顺序**：必须先 `registerAddon` 再 `registerBotCommand(addonName, ...)`
4. **命令上限**：QQ 指令面板最多显示 20 条命令，超出部分仅在 `/帮助` 中显示
5. **旧 API 兼容**：不带 `addonName` 的 `registerBotCommand` 仍然可用，但新代码建议使用扩展 API
