// 生成第三方适配器页（移植自旧的 docs/adapter_gen.py）。
// 输入：.vuepress/data/adapters.json
// 输出：develop/third-party.md（幂等）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const vpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const adapters = JSON.parse(
  fs.readFileSync(path.join(vpRoot, '.vuepress', 'data', 'adapters.json'), 'utf8')
)

function parseGithubUrl(url) {
  const parsed = new URL(url)
  if (parsed.hostname !== 'github.com') {
    throw new Error(`不是合法的 GitHub 地址：${url}`)
  }
  const [owner, repo] = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/')
  if (!owner || !repo) {
    throw new Error(`无法从地址中解析出组织和仓库名：${url}`)
  }
  return { owner, repo }
}

const sections = adapters
  .map((adapter) => {
    const { owner, repo } = parseGithubUrl(adapter.github)
    const badges = [
      `![Stars](https://img.shields.io/github/stars/${owner}/${repo}?style=flat-square)`,
      `![License](https://img.shields.io/github/license/${owner}/${repo}?style=flat-square)`,
      `![Last Commit](https://img.shields.io/github/last-commit/${owner}/${repo}?style=flat-square)`,
      `![Top Language](https://img.shields.io/github/languages/top/${owner}/${repo}?style=flat-square)`
    ].join('\n')
    return [
      `## ${adapter.name}`,
      '',
      `<small>by ${adapter.authors.join(', ')}</small>`,
      '',
      badges,
      '',
      adapter.description,
      '',
      `[**GitHub →**](${adapter.github})`
    ].join('\n')
  })
  .join('\n\n---\n\n')

const page = `<!-- 由 scripts/gen-adapters.mjs 生成，请勿直接编辑；改动请修改 .vuepress/data/adapters.json -->

# 第三方适配器

本页收录社区维护的 HuHoBot 第三方适配器。

## 添加适配器

你可以把自己的适配器加到这一页：编辑 \`.vuepress/data/adapters.json\` 后执行 \`pnpm run gen\`，
或直接向 [HuHoBot.github.io](https://github.com/HuHoBot/HuHoBot.github.io/pulls) 提交 Pull Request。

## 可用适配器列表

${sections}
`

fs.writeFileSync(path.join(vpRoot, 'develop', 'third-party.md'), page)
console.log(`[gen-adapters] 已生成 develop/third-party.md，共 ${adapters.length} 个适配器`)
