# HuHoBotPenguin 文档站（VuePress 2 + Plume）

本目录是 <https://docs.huhobot.dpdns.org/> 的源码，使用
[VuePress 2](https://v2.vuepress.vuejs.org/) + [vuepress-theme-plume](https://theme-plume.vuejs.press/) 构建。
文档源码直接放在仓库根目录。

## 环境要求

- Node.js `^20.19.0 || >=22.12.0`（Plume 的 engines 要求；CI 使用 22）
- pnpm 10

## 本地开发

```bash
pnpm install
pnpm dev          # 开发服务器，默认 http://localhost:8080
pnpm docs:build   # 构建，产物在 .vuepress/dist
pnpm docs:preview # 用静态服务器预览构建产物，http://localhost:4173
pnpm gen          # 只重新生成 Sponsor.md 与 develop/third-party.md
```

注意：VuePress 2 自带 CLI **没有** `preview` 命令，所以预览用 `serve` 起一个静态服务器。
构建产物是绝对路径（`/assets/...`），**直接双击 `dist/index.html` 会变成没样式的纯文本**，
必须通过 HTTP 访问。

## 目录结构

```
.
├── .vuepress/
│   ├── config.ts            站点配置：导航栏、侧边栏、搜索、页脚、markdown
│   ├── data/                生成页面的数据源（不是页面）
│   │   ├── sponsor.json         赞助者数据
│   │   ├── sponsor.template.md  赞助页模板（含 $SponsorList$ 占位符）
│   │   └── adapters.json        第三方适配器数据
│   └── public/              原样拷贝到站点根目录（CNAME、logo、LICENSE.txt）
├── scripts/                 生成脚本（Node，无第三方依赖）
├── index.md                 首页（pageLayout: home）
├── command.md  OnlineList.md  plugins.md  Sponsor.md
├── QuickStart/  Binding/  Agent/
└── develop/                 适配器与脚本扩展开发文档
```

`README.md`（本文件）通过 `config.ts` 的 `pagePatterns` 排除，不会被打成页面。

## 内容约定

- **提示块**用 VuePress 容器，标题可省略：
  `::: tip` / `::: note` / `::: info` / `::: warning` / `::: danger` / `::: details`
- **多语言代码并排**用 `::: code-tabs`，每个页签以 `@tab 标签` 开头：

  ```md
  ::: code-tabs
  @tab JavaScript
  ```javascript
  // ...
  ```

  @tab Lua
  ```lua
  -- ...
  ```
  :::
  ```

  （Plume 的 `code-tabs` 由 `vuepress-plugin-md-power` 提供，该包必须是本项目的
  直接依赖，否则 Vite 解析不到 `VPCodeTabs.vue`。）
- **不要直接写 `{{ ... }}`**：VuePress 同样把 markdown 当 Vue 模板编译，
  `{{ }}` 会被当作插值表达式。HuHoBot 自己的模板占位符（如 `online.md` 里的
  `{{.server}}`）必须包在 `<div v-pre>` 里，否则构建会失败。
- 内部链接用 `.html` 永久链接（例如 `/develop/spigot.html`），目录首页用 `/QuickStart/`。
  指向 `public/` 的文件用绝对路径（如 `/LICENSE.txt`）。

## 自动生成的页面

下面两个页面由 `pnpm gen` 生成，**不要直接编辑**（生成是幂等的，构建不会弄脏工作区）：

| 页面 | 数据源 | 脚本 |
| --- | --- | --- |
| `Sponsor.md` | `.vuepress/data/sponsor.json` + `sponsor.template.md` | `scripts/gen-sponsor.mjs` |
| `develop/third-party.md` | `.vuepress/data/adapters.json` | `scripts/gen-adapters.mjs` |

## 维护注意事项

- **TypeScript 必须锁 5.x**。`@vue/compiler-sfc` 通过 `ts.sys` 解析
  `defineProps<导入类型>()`；TypeScript 7 不再暴露 `ts.sys`，会导致
  `No fs option provided to compileScript` 构建失败。
- `@vuepress/bundler-vite`、`vuepress`、`vuepress-theme-plume` 三个版本需要配套升级。

## 部署

`.github/workflows/docs.yml` 在 push 到 `main` / `master` 时构建并发布到 GitHub Pages：

1. `pnpm install --frozen-lockfile`
2. `pnpm docs:build`
3. 上传 `.vuepress/dist` 并用 `actions/deploy-pages` 发布

Pull Request 只做构建校验，不会发布。发布前请在仓库 **Settings → Pages** 把
Source 设为 **GitHub Actions**。自定义域名由 `.vuepress/public/CNAME` 提供。

站点 `hostname` 与 `editLink` 假设默认分支是 `main`，若仓库默认分支是 `master`
需要同步修改 `.vuepress/config.ts` 的 `docsBranch`。
