# 脚本语法指南

[脚本扩展开发](script-addon.md) 讲的是**怎么装、怎么组织、怎么重载**。本文讲的是**怎么写**——三种语言的语法差异、类型怎么映射、回调怎么声明、以及每个坑的成因和修法。

## 选语言

| | JavaScript | Lua | Python |
|---|---|---|---|
| 引擎 | GraalJS（独立 jar） | LuaJ（主插件自带） | GraalPy 3（独立 jar） |
| 引擎体积 | 约 34 MB | 0 | 约 125 MB |
| 首次加载耗时 | 1 秒内 | 立即 | 首次要解压标准库，约 10 秒 |
| 语法特点 | 和 Java 最像，异步回调用闭包 | 最轻量，方法调用**必须用冒号** | 读起来最像普通脚本，缩进敏感 |
| 适合 | 想要完整语言能力 | 只想挂个监听或定时任务 | 熟悉 Python、或者要解析 JSON |

三者的能力完全对等，只是语法不同。下面每一节都给出三种写法。

---

## 1. 通用约定

### 1.1 方法调用：Lua 必须用冒号

`Bird` 是一个 Java 对象。JS 和 Python 直接点调用：

```javascript
Bird.broadcast("hello")            // JavaScript
```

```python
Bird.broadcast("hello")            # Python
```

Lua 必须用冒号，因为 Lua 的 `:` 会自动传入 `self`：

```lua
Bird:broadcast("hello")
```

```lua
-- 错误：等价于 Bird.broadcast(Bird, "hello")，参数会整体错位
Bird.broadcast("hello")
```

对象上的方法同理：

```lua
local player = Bird:getPlayer("Steve")
local world = player:getWorld()      -- 对
-- local world = player.getWorld()   -- 错，会把 player 当成参数
```

### 1.2 类型映射

| Java | JavaScript | Lua | Python |
|------|-----------|-----|--------|
| `String` | string | string | str |
| `int` / `long` | number | number（都是 double） | int |
| `double` | number | number | float |
| `boolean` | boolean | boolean（只有 `true` / `false`） | bool |
| `void` | `undefined` | `nil` | `None` |
| `null` | `null` | `nil` | `None` |
| `T[]` | 类数组，有 `.length`，下标 0 起 | 1 起的 table | 序列 |
| `List<T>` | 有 `.length`，下标 0 起 | 1 起的 table | 序列，`len()` |
| `Map<K,V>` | `obj.key` | `t.key` | `d["key"]` |
| Bukkit 对象（`Player` 等） | 直接调方法 | 冒号调方法 | 直接调方法 |

!!! tip "Lua 的数字全是 double"

    `tonumber(x)` 拿到的可能是 `1.0` 而不是 `1`。拼字符串前先 `tostring()`，
    需要整数语义时用 `math.floor`。

### 1.3 数组、列表与字典

这是最容易踩的地方。**同一种返回��，三种语言拿到的形态不同**：

```javascript
// JavaScript：List 表现得像数组
const keys = Bird.getDataKeys();
console.log(keys.length);      // 长度
console.log(keys[0]);          // 第 1 个
for (const k of keys) { }
```

```lua
-- Lua：List 会被转成真正的 table，1 起
local keys = Bird:getDataKeys()
print(#keys)                   -- 长度
print(keys[1])                 -- 第 1 个
for i, k in ipairs(keys) do end
for k, v in pairs(cfg) do end   -- Map 用 pairs
```

```python
# Python：List 就是一个序列
keys = Bird.getDataKeys()
print(len(keys))
print(keys[0])
for k in keys:
    pass
```

!!! warning "Lua 侧是 1 起，写 0 起会拿到 nil"

    LuaJ 会把 Java 的 `List` 和 `Map` 变成 userdata，在 Lua 里既不能取长度也不能
    `pairs`。插件的 Lua 绑定层会把容器返回值转成真正的 table，所以是标准的
    1 起序列。这条桥接是必要的：不加的话 `Bird.onCommand(name, perm, fn)` 这种
    三参数重载会直接抛 `no coercible public method`（LuaJ 在目标方法有 3 个以上
    参数且含函数式接口时不做自动转换）。

**新建容器**不受影响，按各语言习惯写就行：

```javascript
const lore = ["第一行", "第二行"];
const headers = { "X-Token": "abc" };
```

```lua
local lore = { "第一行", "第二行" }
local headers = { ["X-Token"] = "abc" }
```

```python
lore = ["第一行", "第二行"]
headers = {"X-Token": "abc"}
```

### 1.4 空值

找不到玩家、目录不存在时返回空值。**一定要判空**：

```javascript
const player = Bird.getPlayer("Steve");
if (player != null) {
    Bird.giveItem(player, "DIAMOND", 1);
}
```

```lua
local player = Bird:getPlayer("Steve")
if player ~= nil then
    Bird:giveItem(player, "DIAMOND", 1)
end
```

```python
player = Bird.getPlayer("Steve")
if player is not None:
    Bird.giveItem(player, "DIAMOND", 1)
```

### 1.5 颜色码

所有文本参数都认 `&` 颜色码，和配置文件里写的一样：

```
&0 黑  &1 暗蓝  &2 暗绿  &3 暗青  &4 暗红  &5 暗紫  &6 金  &7 灰
&8 暗灰  &9 蓝  &a 绿  &b 青  &c 红  &d 淡紫  &e 黄  &f 白
&l 加粗  &o 斜体  &n 下划线  &m 删除线  &k 混淆  &r 重置
```

`Bird.colorize(text)` 手动转换，`Bird.stripColor(text)` 去掉颜色码。

### 1.6 线程

- **Bukkit 事件、命令回调、定时任务**都在服务器主线程执行
- **`Bird.fetch` 的请求**在异步线程发，**回调切回主线程**
- `Bird.sleep()` / `Bird.waitTicks()` 在主线程调用会被拒绝并记警告（会卡住整个服务器），要阻塞就包在 `runTaskAsync` 里

---

## 2. 回调

`Bird` 的回调参数在 Java 侧声明成 `Object`，由桥接层转成脚本函数。**传进来的东西不是函数时，会记一条警告并跳过该项注册**，脚本后面的代码继续执行。

### 2.1 Bukkit 事件

```javascript
Bird.onEvent("org.bukkit.event.player.PlayerJoinEvent", function (event) {
    Bird.broadcast(event.getPlayer().getName() + " joined");
});

// 带优先级
Bird.onEvent("org.bukkit.event.player.PlayerJoinEvent", "HIGH", function (event) { });
```

```lua
Bird:onEvent("org.bukkit.event.player.PlayerJoinEvent", function(event)
    Bird:broadcast(event:getPlayer():getName() .. " joined")
end)

Bird:onEvent("org.bukkit.event.player.PlayerJoinEvent", "HIGH", function(event)
end)
```

```python
def on_join(event):
    Bird.broadcast(event.getPlayer().getName() + " joined")

Bird.onEvent("org.bukkit.event.player.PlayerJoinEvent", on_join)
Bird.onEvent("org.bukkit.event.player.PlayerJoinEvent", "HIGH", on_join)
```

- 类名必须是**全限定名**。写错只记一条警告，不中断脚本
- 优先级取值：`LOWEST` `LOW` `NORMAL` `HIGH` `HIGHEST` `MONITOR`，写错退回 `NORMAL`
- 监听器**不是** ignore-cancelled：被别的插件取消的事件仍会送到脚本
- 事件对象是 Bukkit 原生对象，方法按各语言习惯调

### 2.2 游戏内命令

四个重载，`permission` 和 Tab 补全回调都是可选的：

```javascript
Bird.onCommand("hello", function (sender, label, args) {
    Bird.tell(sender, "在线 " + Bird.getOnlineCount());
    return true;
}, function (sender, label, args) {
    return ["give", "time"];        // 返回数组
});
```

```lua
Bird:onCommand("hello", "huhobot.command", function(sender, label, args)
    -- args 是 1 起的 table
    local sub = "info"
    if args ~= nil and #args > 0 then sub = tostring(args[1]) end
    Bird:tell(sender, "在线 " .. Bird:getOnlineCount())
    return true
end, function(sender, label, args)
    return {"give", "time"}          -- 返回 table
end)
```

```python
def on_hello(sender, label, args):
    Bird.tell(sender, "在线 " + str(Bird.getOnlineCount()))
    return True

def complete_hello(sender, label, args):
    return ["give", "time"]          # 返回 list

Bird.onCommand("hello", "huhobot.command", on_hello, complete_hello)
```

- 回调签名固定是 `(sender, label, args)`
- `args` 是 Bukkit 传入的 `String[]`，**不包含命令名本身**
- 命令通过反射拿到的 `CommandMap` 注册，**不需要改 `plugin.yml`**
- 建议 `return true`；返回 `false` 或不返回时 Bukkit 会把剩余参数当玩家名尝试转换

!!! warning "sender 可能是控制台"

    从控制台执行时 `sender` 是 `TerminalConsoleCommandSender`，不是 `Player`。
    `Bird.tell` 有 `CommandSender` 重载所以没问题，但 `giveItem` / `sendActionBar` /
    `playSound` 这些只接受 `Player`，从控制台调用会报参数类型不匹配。
    先用 `Bird.getPlayer(sender.getName())` 拿到玩家再调。

### 2.3 定时任务

```javascript
Bird.runTaskTimer(function () {
    Bird.broadcast("tick");
}, 20, 20 * 60);                      // 延迟 1 秒，每 60 秒一次

const id = Bird.runTaskLater(function () { }, 100);
Bird.cancelTask(id);
```

```lua
Bird:runTaskTimer(function()
    Bird:broadcast("tick")
end, 20, 20 * 60)

local id = Bird:runTaskLater(function() end, 100)
Bird:cancelTask(id)
```

```python
def tick():
    Bird.broadcast("tick")

Bird.runTaskTimer(tick, 20, 20 * 60)
task_id = Bird.runTaskLater(lambda: None, 100)
Bird.cancelTask(task_id)
```

| 方法 | 时机 |
|------|------|
| `runTask(fn)` | 下一拍主线程 |
| `runTaskLater(fn, ticks)` | 延迟 `ticks` 拍（20 拍 = 1 秒） |
| `runTaskTimer(fn, delay, period)` | 延迟后按周期重复 |
| `runTaskAsync(fn)` | 异步线程执行一次 |
| `runTaskTimerAsync(fn, delay, period)` | 异步周期任务 |

所有方法都返回 `taskId`。**脚本重载或卸载时，这些任务会被自动取消**，不用自己清。

### 2.4 HTTP

四个重载，`method` / `body` / `headers` 都可省：

```javascript
Bird.fetch("https://example.com/api", "GET", function (result) {
    if (result.ok) {                       // ok 就是 2xx
        Bird.log(result.body);
    } else {
        Bird.warn("status=" + result.status + " " + result.body);
    }
});
```

```lua
Bird:fetch("https://example.com/api", "GET", function(result)
    if result.ok then
        Bird:log(result.body)
    else
        Bird:warn("status=" .. tostring(result.status) .. " " .. result.body)
    end
end)

-- 带 body 和请求头
Bird:fetch("https://example.com/api", "POST", '{"a":1}', { ["X-Token"] = "abc" }, function(result)
end)
```

```python
def on_result(result):
    if result.ok:
        Bird.log(result.body)
    else:
        Bird.warn("status=" + str(result.status) + " " + result.body)

Bird.fetch("https://example.com/api", "GET", on_result)
```

- 回调收到 `HttpResult`，三个字段：`status`（int）、`body`（string）、`ok`（bool，2xx 为真）
- 连接失败时 `status` 为 `0`，`body` 是错误文本
- 超时 10 秒
- 有 `body` 且没给 `Content-Type` 时默认 `application/json`

Python 里解析 JSON：

```python
import json

def on_result(result):
    if result.ok:
        data = json.loads(result.body)
        Bird.setData("latest", data.get("tag_name", "?"))

Bird.fetch("https://api.github.com/repos/HuHoBot/PenguinAgent/releases/latest", "GET", on_result)
```

!!! warning "证书链不在 JVM 信任库时会失败"

    `Bird.fetch` 用的是 JVM 的默认信任库。如果目标站点出示的证书链不被信任
    （典型情况：本机装了流量代理 / 代理软件时 GitHub 会被拦截），会得到
    `status=0` 和 `PKIX path building failed`。这不是插件的问题——用同一套
    JDK 在插件之外发 HTTPS 请求也会失败。解决办法是把对应根证书导入服务端
    JVM 的 `cacerts`，或者换一个可信站点测试。

### 2.5 脚本之间的事件

`Bird.on` / `Bird.emit` 是**进程内静态**的总线：脚本 A `emit`，脚本 B 用同一个名字 `on` 就能收到。`emit` 时同步调用监听者。

```javascript
Bird.on("myplugin.reload", function (payload) {
    Bird.log("收到 " + payload);
});
Bird.emit("myplugin.reload", "hello");
```

```lua
Bird:on("myplugin.reload", function(payload)
    Bird:log("收到 " .. tostring(payload))
end)
Bird:emit("myplugin.reload", "hello")
```

```python
def on_reload(payload):
    Bird.log("收到 " + str(payload))

Bird.on("myplugin.reload", on_reload)
Bird.emit("myplugin.reload", "hello")
```

别用它代替 Bukkit 事件——它只在同一台服务器进程内有效。

---

## 3. 错误处理

### 3.1 脚本抛错不会打崩服务器

事件回调、定时任务、命令回调、`fetch` 回调里抛的异常都会被 `Bird` 捕获，记一条带插件名的警告后继续跑。**服务器不会崩**，但那一行逻辑等于没执行。

加载阶段的错误分两种：

| 情况 | 行为 |
|------|------|
| 语法错误、顶层抛错 | 该脚本加载失败，它登记过的 addon、命令、监听器、定时任务、QQ 群命令**全部撤销** |
| 注册时传了非函数 | 记一条警告，跳过该项注册，脚本其余部分继续 |

### 3.2 语言级的 try/catch

需要自己兜住错误时用各语言自己的语法：

```javascript
try {
    Bird.giveItem(player, "NOT_A_REAL_ITEM", 1);
} catch (e) {
    Bird.warn("giveItem 失败: " + e);
}
```

```lua
local ok, err = pcall(function()
    Bird:giveItem(player, "NOT_A_REAL_ITEM", 1)
end)
if not ok then
    Bird:warn("giveItem 失败: " .. tostring(err))
end
```

```python
try:
    Bird.giveItem(player, "NOT_A_REAL_ITEM", 1)
except Exception as e:
    Bird.warn("giveItem 失败: " + str(e))
```

### 3.3 明确的失败返回值

部分方法失败时返回 `false` 或 `0` 而不是抛异常，**要检查返回值**：

| 方法 | 失败时 |
|------|--------|
| `tell(玩家名, 文本)` | `false`（找不到人） |
| `setBlockType(...)` | `false`（世界或材料不存在） |
| `setGameMode(玩家, 模式)` | `false`（非法值） |
| `removeItem(玩家, 材料, 数量)` | `false`（数量不足，且不删除） |
| `fetch` 回调 | `result.ok` 为 `false`，`status` 为 `0` |
| `getDistance(a, b)` | `-1`（不同世界） |

材料名、声音名、粒子名、药水效果名都按 Bukkit 枚举名解析，**大小写不敏感**。非法值记警告并返回，不抛异常。

---

## 4. 字符串与数字

=== "JavaScript"

    ```javascript
    // 字符串
    const s = "a" + 1;                 // "a1"
    const n = parseInt("42", 10) + 1;  // 43
    const f = parseFloat("1.5");
    const tpl = `在线 ${Bird.getOnlineCount()} 人`;

    // 随机（两端都含）
    const dice = Bird.random(1, 6);
    ```

=== "Lua"

    ```lua
    -- 字符串
    local s = "a" .. 1                       -- "a1"
    local n = tonumber("42") + 1             -- 43
    local tpl = "在线 " .. tostring(Bird:getOnlineCount()) .. " 人"

    -- Lua 里数字都是 double，tonumber 可能拿到 1.0
    local whole = math.floor(tonumber("1.9"))

    local dice = Bird:random(1, 6)
    ```

=== "Python"

    ```python
    # 字符串
    s = "a" + str(1)                          # "a1"
    n = int("42") + 1                         # 43
    f = float("1.5")
    tpl = "在线 " + str(Bird.getOnlineCount()) + " 人"

    # 解析可能是脏数据的返回值
    try:
        count = int(Bird.getData("load_count", "0")) + 1
    except ValueError:
        count = 1
    Bird.setData("load_count", str(count))

    dice = Bird.random(1, 6)
    ```

`Bird.random(min, max)` 两端都含。`Bird.formatTime(秒)` 返回 `HH:MM:SS`。

---

## 5. 数据、配置与文件

### 5.1 setData：脚本私有键值

```javascript
Bird.setData("last_seen", "2026-01-01");
const v = Bird.getData("load_count", "0");     // 带默认值
const keys = Bird.getDataKeys();
Bird.removeData("last_seen");
Bird.saveData();                               // setData 已经会立刻写盘
```

```lua
Bird:setData("last_seen", "2026-01-01")
local v = Bird:getData("load_count", "0")
local keys = Bird:getDataKeys()               -- 1 起的 table
Bird:removeData("last_seen")
```

```python
Bird.setData("last_seen", "2026-01-01")
v = Bird.getData("load_count", "0")
keys = Bird.getDataKeys()
Bird.removeData("last_seen")
```

落盘位置是 `addons/data/<脚本名>.properties`。

### 5.2 config：用户可改的配置

`config` 在启动时按 `_conf_schema.json` 补齐默认值，并写回 `addons/config/<名字>.json` 让用户能看到全部可配置项。

```javascript
const token = config.get("token", "");
const n = config.getInt("cooldown", 30);
config.set("token", "abc");
config.save();
```

```lua
local token = config:get("token", "")
config:set("token", "abc")
config:save()
```

```python
token = config.get("token", "")
config.set("token", "abc")
config.save()
```

`_conf_schema.json` 声明每个键的 `default`。`default` 是 `null` 或没写的键**不会**进配置表，`get` 返回 `null`，不影响加载。

保留键 `_enabled: false` 表示禁用该插件——不算失败，`/huhobot scripts reload` 报「跳过」。

### 5.3 kv：另一个键值空间

```javascript
kv.set("a", "1");
const v = kv.get("a", "0");
const all = kv.all();
kv.remove("a");
```

### 5.4 文件

```javascript
Bird.saveFile("data.json", JSON.stringify({ a: 1 }));
const text = Bird.readFile("data.json");
Bird.fileExists("data.json");
Bird.deleteFile("data.json");
const list = Bird.listFiles();
```

只能写到 `addons/files/<脚本名>/` 里面，路径逃逸（`../`）会被拒绝。`exe bat cmd dll so sh bash jar php ps1 vbs` 等扩展名一律拒绝。

`DATA_DIR` 是该插件 `data/` 的绝对路径。

---

## 6. QQ 群命令

脚本可以往 QQ 群里加自定义命令，也可以主动发消息。

```javascript
// 第一个参数必须是已登记的 addon 名
Bird.registerBotCommand(Bird.addonName(), "查天气", "say {name} 的天气是 sunny");
Bird.sendBotText("服务器维护中");
Bird.sendBotMarkdown("# 标题\n内容");
```

```lua
Bird:registerBotCommand(Bird:addonName(), "查天气", "say {name} 的天气是 sunny")
Bird:sendBotText("服务器维护中")
Bird:sendBotMarkdown("# 标题\n内容")
```

```python
Bird.registerBotCommand(Bird.addonName(), "查天气", "say {name} 的天气是 sunny")
Bird.sendBotText("服务器维护中")
Bird.sendBotMarkdown("# 标题\n内容")
```

`registerBotCommand` 的完整签名：

```text
registerBotCommand(addon名, key, 命令模板, 权限, 是否推送到QQ菜单)
registerBotCommand(addon名, key, 命令模板)      权限 0 = 公开，推送到菜单
```

- `addon名` 必须是**已经登记的** addon 名，也就是 `Bird.addonName()` 的返回值
- `命令模板` 是一条服务器命令，占位符和配置文件自定义命令相同：`{params}` `{group}` `{user}` `{name}` `{nickname}` `{0}` `{1}`
- 权限 `0` 为公开，大于 `0` 仅管理员
- 面板最多显示 20 条，超出的只在 `/帮助` 里

!!! warning "key 撞车会互相覆盖"

    `key` 在全局去重。多个脚本用同一个 `key`（比如都叫「脚本测试」）时，
    后注册的会顶掉先注册的。建议带上插件名：`"huho-test-lua:info"`。

**清理**：`Bird.unregisterBotCommand(key)`，或者直接 `/huhobot scripts reload`——
重载和加载失败都会把这个脚本登记的 key 删掉。

---

## 7. 完整模板

=== "JavaScript"

    ```javascript
    // main.js
    Bird.registerAddon("myplugin", "1.0.0", "我的脚本", "作者");

    const KEY = "visits";

    Bird.onEvent("org.bukkit.event.player.PlayerJoinEvent", function (event) {
        const player = event.getPlayer();
        if (player == null) return;

        const key = "join_" + player.getName();
        const count = parseInt(Bird.getData(key, "0")) + 1;
        Bird.setData(key, String(count));

        Bird.tell(player, "&a欢迎 &f" + player.getName() + " &7(第 " + count + " 次)");
        Bird.sendActionBar(player, "&7在线 " + Bird.getOnlineCount() + " 人");
        Bird.playSound(player, "ENTITY_PLAYER_LEVELUP", 0.8, 1.2);

        // 通知别的脚本
        Bird.emit("myplugin.joined", player.getName());
    });

    Bird.onCommand("myinfo", "huhobot.command", function (sender, label, args) {
        Bird.tell(sender, "&7在线 &f" + Bird.getOnlineCount() + "&7/&f" + Bird.getMaxPlayers());
        Bird.tell(sender, "&7数据键 &f" + Bird.getDataKeys().length + " &7个");
        return true;
    }, function (sender, label, args) {
        return ["give", "time"];
    });

    // 每 5 分钟播报
    Bird.runTaskTimer(function () {
        Bird.broadcast("&7当前在线 &f" + Bird.getOnlineCount() + " &7人");
    }, 20, 20 * 60 * 5);

    // 启动计数
    Bird.setData("load_count", String(parseInt(Bird.getData("load_count", "0")) + 1));
    Bird.log("已加载，第 " + Bird.getData("load_count", "0") + " 次");
    ```

=== "Lua"

    ```lua
    -- main.lua
    Bird:registerAddon("myplugin", "1.0.0", "我的脚本", "作者")

    Bird:onEvent("org.bukkit.event.player.PlayerJoinEvent", function(event)
        local player = event:getPlayer()
        if player == nil then return end

        local key = "join_" .. player:getName()
        local count = tonumber(Bird:getData(key, "0")) + 1
        Bird:setData(key, tostring(count))

        Bird:tell(player, "&a欢迎 &f" .. player:getName() .. " &7(第 " .. tostring(count) .. " 次)")
        Bird:sendActionBar(player, "&7在线 " .. tostring(Bird:getOnlineCount()) .. " 人")
        Bird:playSound(player, "ENTITY_PLAYER_LEVELUP", 0.8, 1.2)

        Bird:emit("myplugin.joined", player:getName())
    end)

    Bird:onCommand("myinfo", "huhobot.command", function(sender, label, args)
        Bird:tell(sender, "&7在线 &f" .. tostring(Bird:getOnlineCount())
            .. "&7/&f" .. tostring(Bird:getMaxPlayers()))
        Bird:tell(sender, "&7数据键 &f" .. tostring(#Bird:getDataKeys()) .. " &7个")
        return true
    end, function(sender, label, args)
        return {"give", "time"}
    end)

    Bird:runTaskTimer(function()
        Bird:broadcast("&7当前在线 &f" .. tostring(Bird:getOnlineCount()) .. " &7人")
    end, 20, 20 * 60 * 5)

    Bird:setData("load_count", tostring(tonumber(Bird:getData("load_count", "0")) + 1))
    Bird:log("已加载，第 " .. Bird:getData("load_count", "0") .. " 次")
    ```

=== "Python"

    ```python
    # main.py
    Bird.registerAddon("myplugin", "1.0.0", "我的脚本", "作者")

    def on_join(event):
        player = event.getPlayer()
        if player is None:
            return

        key = "join_" + player.getName()
        try:
            count = int(Bird.getData(key, "0")) + 1
        except ValueError:
            count = 1
        Bird.setData(key, str(count))

        Bird.tell(player, "&a欢迎 &f" + player.getName() + " &7(第 " + str(count) + " 次)")
        Bird.sendActionBar(player, "&7在线 " + str(Bird.getOnlineCount()) + " 人")
        Bird.playSound(player, "ENTITY_PLAYER_LEVELUP", 0.8, 1.2)

        Bird.emit("myplugin.joined", player.getName())

    Bird.onEvent("org.bukkit.event.player.PlayerJoinEvent", on_join)

    def on_myinfo(sender, label, args):
        Bird.tell(sender, "&7在线 &f" + str(Bird.getOnlineCount())
                  + "&7/&f" + str(Bird.getMaxPlayers()))
        Bird.tell(sender, "&7数据键 &f" + str(len(Bird.getDataKeys())) + " &7个")
        return True

    def complete_myinfo(sender, label, args):
        return ["give", "time"]

    Bird.onCommand("myinfo", "huhobot.command", on_myinfo, complete_myinfo)

    def announce():
        Bird.broadcast("&7当前在线 &f" + str(Bird.getOnlineCount()) + " &7人")

    Bird.runTaskTimer(announce, 20, 20 * 60 * 5)

    try:
        loads = int(Bird.getData("load_count", "0")) + 1
    except ValueError:
        loads = 1
    Bird.setData("load_count", str(loads))
    Bird.log("已加载，第 " + str(loads) + " 次")
    ```

---

## 8. 常见报错速查

| 报错 | 成因 | 修法 |
|------|------|------|
| `no coercible public method` | LuaJ 在目标方法有 3 个以上参数且含函数式接口时不做自动转换 | 插件版本较老。升级到带 Lua 桥接的主插件；自己写扩展时把回调参数声明成 `Object` 再 Proxy |
| `attempt to get length of userdata` | LuaJ 把 Java 的 `List` / `Map` 变成 userdata，Lua 里不能取长度 | 用新版本主插件（会把容器转成 table）；或改用 `Bird.getData(key, default)` 之类不需要遍历的接口 |
| `argument type mismatch` | 宿主对象（`Player` 等）传进 Lua 后再传回来时没解包 | 用新版本主插件；Lua 里始终用 `Bird:getPlayer(...)` 拿到的对象，不要自己缓存 |
| `xxx 第 1 个参数要 Player，收到的是 TerminalConsoleCommandSender` | 从控制台执行了只接受 `Player` 的方法 | 先 `Bird.getPlayer(sender.getName())` 并判空 |
| `ModuleNotFoundError: No module named 'json'` | GraalPy 的 home 还没解压完就加载了 `.py` 脚本 | 重启一次；主插件已加同步预热和一次重试，仍失败说明不是解压竞态 |
| `Found different host access configuration for a context with a shared engine` | 共享 Engine 的两个 Context 用了不同的 host access 实例 | 引擎 jar 版本要与主插件一致，不要混用不同次构建的引擎 |
| `status=0 ... PKIX path building failed` | 目标站点证书链不在 JVM 信任库（常见于本机装了流量代理） | 把根证书导入服务端 JVM 的 `cacerts`，或换可信站点测试 |
| `Unknown event class: ...` | `onEvent` 的类名不是全限定名 | 写完整包名，例如 `org.bukkit.event.player.PlayerJoinEvent` |
| `插件名 xxx 已被另一个目录使用` | 两个目录的 `metadata.yaml` 里 `name` 相同 | `name` 必须唯一，且重载键是目录名 |
| 脚本不加载，日志说「脚本扩展已改为目录插件」 | `addons/` 根上直接放了 `.js` / `.lua` / `.py` | 改成 `addons/<名字>/main.lua` 这样的目录结构 |

---

## 相关页面

- [脚本扩展开发](script-addon.md) —— 安装、目录结构、重载
- [Spigot/Paper 附属插件开发](spigot.md) —— 编译型附属插件
- [指令列表](../command.md)

## 致谢

`Bird` 对象与脚本加载、生命周期设计借鉴并移植自
[birdlibraryapi](https://github.com/prach1121/birdlibraryapi)（Apache-2.0，原作者 prach1121），
并按 Spigot 1.16+ 与 HuHoBot 附属插件注册做了适配。
