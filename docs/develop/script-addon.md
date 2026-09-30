# Spigot 脚本扩展开发（JS / Lua / Python）

HuHoBotPenguin 允许用 JavaScript、Lua 或 Python 写脚本插件，无需编译 JAR。目前仅 Spigot / Paper 平台支持。

本页讲**怎么装、怎么组织、怎么重载**。**怎么写代码**看 [脚本语法指南](script-addon-syntax.md)。

## 准备引擎

一个脚本插件是 `addons/` 下的**一个目录**，不是单个文件。根目录上直接放的 `.js` / `.lua` / `.py` **不会被加载**。

| 入口 | 引擎 | 放在哪 | 体积 |
|------|------|--------|------|
| `main.lua` | LuaJ 3.0.1 | 已在主插件 jar 内 | — |
| `main.js` | GraalJS 24.1.2 | `plugins/HuHoBotPenguin/engines/HuHoBot-Engine-GraalJs-<版本>.jar` | 约 34 MB |
| `main.py` | GraalPy 24.1.2（Python 3） | `plugins/HuHoBotPenguin/engines/HuHoBot-Engine-GraalPy-<版本>.jar` | 约 125 MB |

`engines/` 目录在插件启动时自动创建。**不放引擎 jar 插件也能正常启动**，只是对应语言的脚本加载失败，其余语言不受影响。

引擎 jar 由主仓库构建，需与主插件同一次构建：

```bash
./gradlew :server-Spigot:shadowJar :addon-GraalJs:shadowJar :addon-GraalPy:shadowJar
```

!!! warning "引擎版本必须与主插件一致"

    引擎 jar 的文件名带构建版本。放进 `engines/` 的 `HuHoBot-Engine-*.jar` 如果和当前插件版本对不上，启动时会写一条警告——这种组合下脚本多半会以难懂的方式失败，换成同一次构建产出的 jar 即可。

## 目录结构

```
plugins/HuHoBotPenguin/
├── addons/
│   └── hello/
│       ├── metadata.yaml          name / version / author / description / entry
│       ├── _conf_schema.json      配置声明（可选）
│       ├── requirements.txt       Python 依赖声明（可选，仅预检提示）
│       └── main.js                或 main.lua / main.py
├── config/
│   └── hello.json                 实际配置值
└── data/
    └── hello/                     setData / kv 的落盘位置
```

`metadata.yaml` 只解析顶层的 `key: value`，不引入 YAML 库：

```yaml
name: hello
version: 1.0.0
author: 你的名字
description: 一个打招呼的脚本
entry: main.js        # 可省略，默认按 main.lua → main.py → main.js 找
```

`metadata.yaml` 里的 `name` 决定 addon 的登记名，也是重载时的键；`config` 和 `data` 的路径都由它派生。`name` 不能带路径分隔符。

## 重载

```
/huhobot scripts reload            # 全部
/huhobot scripts reload hello      # 单个，目录名大小写不敏感
```

权限 `huhobot.command`。Tab 补全会列出 `addons/` 下的目录名。

## 注入的全局对象

三种语言注入同一组对象，行为一致：

| 名字 | 是什么 | 用来做什么 |
|------|--------|------------|
| `Bird` | `BirdScriptApi` 实例 | 事件、命令、定时器、玩家、方块、HTTP、QQ 群命令。优先用它 |
| `Bukkit` | `org.bukkit.Bukkit` 这个**类** | JS 用 `Java.type` 不需要它；Lua 直接 `Bukkit.getOnlinePlayers()` |
| `server` | 当前 `org.bukkit.Server` | 已经是对象，直接调用 |
| `plugin` | 插件实例 | 一般不需要 |
| `config` | 配置表 | `config.get("token")` / `config.getString` / `config.set` |
| `kv` | 键值存储 | `kv.set` / `kv.get` / `kv.all` |
| `DATA_DIR` | 字符串 | 该插件的 `data/` 绝对路径 |

JS 和 Python 用点调用，Lua 用冒号调用（`Bird:onCommand(...)`）。点号调用会丢掉 `self` 导致参数错位。

## 第一个脚本

=== "JavaScript"

    ```javascript
    Bird.registerAddon("hello", "1.0.0", "打招呼", "你的名字");

    Bird.onEvent("org.bukkit.event.player.PlayerJoinEvent", function (event) {
        const player = event.getPlayer();
        Bird.tell(player, "&a欢迎 &f" + player.getName());
        Bird.playSound(player, "ENTITY_PLAYER_LEVELUP", 0.8, 1.2);
    });

    Bird.onCommand("hello", "huhobot.command", function (sender, label, args) {
        Bird.tell(sender, "&7在线 &f" + Bird.getOnlineCount() + " &7人");
        return true;
    }, function (sender, alias, args) {
        return ["give", "time"];
    });

    Bird.runTaskTimer(function () {
        Bird.broadcast("&7当前在线 &f" + Bird.getOnlineCount() + " &7人");
    }, 20, 20 * 60);
    ```

=== "Lua"

    ```lua
    Bird:registerAddon("hello", "1.0.0", "打招呼", "你的名字")

    Bird:onEvent("org.bukkit.event.player.PlayerJoinEvent", function(event)
        local player = event:getPlayer()
        Bird:tell(player, "&a欢迎 &f" .. player:getName())
        Bird:playSound(player, "ENTITY_PLAYER_LEVELUP", 0.8, 1.2)
    end)

    Bird:onCommand("hello", "huhobot.command", function(sender, label, args)
        -- 注意：参数下标从 1 开始
        local sub = args ~= nil and #args > 0 and tostring(args[1]) or "info"
        Bird:tell(sender, "&7在线 &f" .. Bird:getOnlineCount() .. " &7人")
        return true
    end, function(sender, alias, args)
        return {"give", "time"}
    end)

    Bird:runTaskTimer(function()
        Bird:broadcast("&7当前在线 &f" .. Bird:getOnlineCount() .. " &7人")
    end, 20, 20 * 60)
    ```

=== "Python"

    ```python
    Bird.registerAddon("hello", "1.0.0", "打招呼", "你的名字")

    def on_join(event):
        player = event.getPlayer()
        Bird.tell(player, "&a欢迎 " + player.getName())
        Bird.playSound(player, "ENTITY_PLAYER_LEVELUP", 0.8, 1.2)

    Bird.onEvent("org.bukkit.event.player.PlayerJoinEvent", on_join)

    def on_hello(sender, label, args):
        Bird.tell(sender, "&7在线 " + str(Bird.getOnlineCount()) + " 人")
        return True

    def complete_hello(sender, alias, args):
        return ["give", "time"]

    Bird.onCommand("hello", "huhobot.command", on_hello, complete_hello)

    def announce():
        Bird.broadcast("&7当前在线 " + str(Bird.getOnlineCount()) + " 人")

    Bird.runTaskTimer(announce, 20, 20 * 60)
    ```

## 索引规则（重要）

`Bird` 返回的 `List` / `Map` 和命令参数，在三种语言里形态不同：

| | 命令参数下标 | 列表 | 字典 |
|---|---|---|---|
| JavaScript | `args[0]` | `.length`、`arr[0]` | `obj.key` |
| Lua | `args[1]` | `#t`、`t[1]`、`ipairs(t)` | `t.key`、`pairs(t)` |
| Python | `args[0]` | `len(x)`、`for v in x` | `x["key"]` |

!!! warning "Lua 侧是 1 起"

    LuaJ 会把 Java 的 `List` 和 `Map` 变成 userdata，在 Lua 里既不能取长度也不能 `pairs`。
    插件的 Lua 绑定层会把容器返回值转成真正的 Lua table，所以是标准的 1 起序列。
    写 0 起下标会拿到 `nil`。

## 常用 API

```text
Bird.registerAddon(name, version, description, author)
Bird.registerBotCommand(addonName, 群里的指令, 模板, {permission}, {pushMenu})

Bird.onEvent(类全名, 回调)                 优先级用三参重载
Bird.onCommand(名字[, 权限], 回调[, Tab补全回调])
Bird.runTask / runTaskLater / runTaskTimer / runTaskAsync / runTaskTimerAsync
Bird.cancelTask(任务号)

Bird.getData(key[, 默认值]) / setData(key, value) / getDataKeys()
Bird.fetch(url[, method[, body[, headers]]], 回调)      异步，回调在主线程
Bird.emit(事件名, 数据) / on(事件名, 回调)                跨脚本事件总线

Bird.tell(发送者, 消息)                     玩家 / 任意 CommandSender / 玩家名
Bird.broadcast(消息) / sendActionBar(玩家, 消息) / playSound(玩家, 音效, 音量, 音调)
Bird.getPlayer(名字) / getOnlineCount() / getMaxPlayers() / getWorldNames()
Bird.giveItem(玩家, 材质, 数量[, 显示名[, lore]])      背包满时溢出掉落
```

完整的 API 列表见主仓库的 [`docs/spigot-script-addons.md`](https://github.com/HuHoBot/PenguinAgent/blob/master/docs/spigot-script-addons.md)。

## 重载时卸掉什么

```text
/huhobot scripts reload hello
```

对这一份 `Bird` 做：

1. 反注册它登记过的 Bukkit 事件。
2. 从命令表摘掉 `onCommand` 注册的动态命令。
3. 取消它创建的全部定时任务。
4. 删掉它登记的 QQ 群命令。
5. `unregisterAddon`，再重新加载这个目录。

加载失败时走同一套撤销步骤，所以半路抛错的脚本不会把已登记的东西留在服务器上。

## 失败与禁用

| 情况 | 行为 |
|------|------|
| 入口编译或执行失败 | 控制台一条 `[名字] ... error`，该脚本登记的内容全部撤销，其它目录继续加载 |
| 两个目录的 `name` 相同 | 后一个被跳过，日志写「插件名已被另一个目录使用」 |
| `config/hello.json` 里 `"_enabled": false` | 不加载，记为「跳过」而不是「失败」 |
| 缺引擎 jar | 该语言的脚本报「未安装脚本引擎」，其它语言不受影响 |
| 脚本回调抛错 | `Bird` 捕获后写警告，不会把服务器打崩 |

## 已知边界

- `Bird.fetch` 走 JVM 的默认信任库。目标站点的证书链不在信任库里时会失败（例如本机装了流量代理时 GitHub 会被拦截）。需要访问这类站点时，把对应根证书导入服务端 JVM 的 `cacerts`。
- Python 的 `requirements.txt` 只做 `import` 预检并打警告，**不会自动安装**任何第三方库。
- 主插件是 Java 8 字节码，可以跑在 1.16.5 及以上的 Spigot / Paper 上；两个引擎包由 Java 17 构建，但它们只是被加载的库，不影响服务端自身的 Java 要求。
- `fetch` 回调在主线程执行，回调里不要做长时间阻塞操作。

## 相关页面

- [脚本语法指南](script-addon-syntax.md) —— 三种语言的写法、类型映射、回调、常见报错
- [适配器开发](adapter-api.md)
- [Spigot/Paper 附属插件开发](spigot.md)
- [指令列表](../command.md)
