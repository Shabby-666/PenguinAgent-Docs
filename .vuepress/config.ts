import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
  lang: 'zh-CN',
  title: 'HuHoBotPenguin 文档',
  description: '基于 PenguinClient 的增强分支，新增 QQ 绑定系统、AI Agent 管理助手、WebUI 管理面板与脚本扩展。',

  head: [
    ['link', { rel: 'icon', href: '/img/logo.png' }],
  ],

  // README.md 是给开发者看的项目说明，不是站点页面
  pagePatterns: ['**/*.md', '!.vuepress', '!node_modules', '!README.md'],

  bundler: viteBundler(),

  theme: plumeTheme({
    logo: '/img/logo.png',
    hostname: 'https://docs.huhobot.dpdns.org/',

    docsRepo: 'https://github.com/HuHoBot/HuHoBot.github.io',
    docsBranch: 'main',
    docsDir: '',
    editLink: true,
    lastUpdated: true,
    contributors: false,
    changelog: false,

    search: { provider: 'local' },

    navbar: [
      { text: '主页', link: '/' },
      { text: '快速开始', link: '/QuickStart/' },
      { text: '命令列表', link: '/command.html' },
      { text: '绑定系统', link: '/Binding/' },
      { text: 'AI Agent', link: '/Agent/' },
      { text: '消息格式', link: '/Message/' },
      { text: '状态通知', link: '/Notify/' },
      { text: '在线列表', link: '/OnlineList.html' },
      { text: '附属插件', link: '/plugins.html' },
      {
        text: '适配器开发',
        items: [
          { text: '公共 API', link: '/develop/adapter-api.html' },
          { text: 'Spigot / Paper', link: '/develop/spigot.html' },
          { text: 'Nukkit-MOT（上游）', link: '/develop/nukkit-mot.html' },
          { text: 'BungeeCord（上游）', link: '/develop/bungeecord.html' },
          { text: 'Velocity（上游）', link: '/develop/velocity.html' },
          { text: 'Allay（上游）', link: '/develop/allay.html' },
          { text: '第三方适配器', link: '/develop/third-party.html' },
        ],
      },
      {
        text: '脚本扩展',
        items: [
          { text: '概览', link: '/develop/script-addon.html' },
          { text: '语法指南', link: '/develop/script-addon-syntax.html' },
        ],
      },
      { text: '赞助', link: '/Sponsor.html' },
    ],

    sidebar: {
      '/': [
        { text: '主页', link: '/' },
        { text: '快速开始', link: '/QuickStart/' },
        { text: '命令列表', link: '/command.html' },
        { text: '绑定系统', link: '/Binding/' },
        { text: 'AI Agent', link: '/Agent/' },
        { text: '消息格式与颜色', link: '/Message/' },
        { text: '服务器状态通知', link: '/Notify/' },
        { text: '在线列表配置', link: '/OnlineList.html' },
        { text: '附属插件列表', link: '/plugins.html' },
        { text: '赞助 HuHoBot', link: '/Sponsor.html' },
        {
          text: '适配器开发',
          items: [
            { text: '公共 API', link: '/develop/adapter-api.html' },
            { text: 'Spigot / Paper', link: '/develop/spigot.html' },
            { text: 'Nukkit-MOT（上游）', link: '/develop/nukkit-mot.html' },
            { text: 'BungeeCord（上游）', link: '/develop/bungeecord.html' },
            { text: 'Velocity（上游）', link: '/develop/velocity.html' },
            { text: 'Allay（上游）', link: '/develop/allay.html' },
            { text: '第三方适配器', link: '/develop/third-party.html' },
          ],
        },
        {
          text: '脚本扩展开发（Spigot）',
          items: [
            { text: '概览', link: '/develop/script-addon.html' },
            { text: '语法指南', link: '/develop/script-addon-syntax.html' },
          ],
        },
      ],
    },

    footer: {
      message: '基于 GNU AGPL-3.0 许可发布',
      copyright: 'Copyright © 2026 HuoHuas001',
    },
  }),
})
