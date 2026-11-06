// 生成赞助者名单页（移植自旧的 docs/sponsor_gen.py）。
// 输入：.vuepress/data/sponsor.json + .vuepress/data/sponsor.template.md
// 输出：Sponsor.md（幂等：数据不变时输出不变，构建不会弄脏工作区）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const vpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(vpRoot, '.vuepress', 'data')

const template = fs.readFileSync(path.join(dataDir, 'sponsor.template.md'), 'utf8')
const sponsors = JSON.parse(fs.readFileSync(path.join(dataDir, 'sponsor.json'), 'utf8'))

if (!template.includes('$SponsorList$')) {
  throw new Error('sponsor.template.md 缺少 $SponsorList$ 占位符')
}

sponsors.sort((a, b) => b.amount - a.amount)

const rows = sponsors.map((s) => {
  let avatar = ''
  if (s.QQ) {
    avatar = `![头像](https://q1.qlogo.cn/g?b=qq&nk=${s.QQ}&s=100)`
  } else if (s.imgUrl) {
    avatar = `![头像](${s.imgUrl})`
  }
  const message = (s.message ?? '').trim() || ' '
  return `| ${avatar} | **${s.name}** | ${message} | ${s.amount}CNY |`
})

const header = '<!-- 由 scripts/gen-sponsor.mjs 生成，请勿直接编辑；改动请修改 .vuepress/data/sponsor.json -->\n\n'
fs.writeFileSync(path.join(vpRoot, 'Sponsor.md'), header + template.replace('$SponsorList$', rows.join('\n')))
console.log(`[gen-sponsor] 已生成 Sponsor.md，共 ${sponsors.length} 位赞助者`)
