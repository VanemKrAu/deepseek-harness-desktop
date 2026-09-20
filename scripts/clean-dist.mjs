import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = path.join(root, 'dist')

// 只认这些扩展名为「安装包产物」；其余文件（latest.yml、builder-debug.yml 等）一律不碰。
const ARTIFACT_PATTERN = /\.(?:exe|zip|dmg|AppImage|deb|blockmap)$/i

/**
 * 判断产物文件名是否属于指定版本。
 *
 * 用「当前版本号 + 非数字非点的边界」匹配，而不是从文件名里反解版本号：
 * 后者会把 `...-0.3.10-windows-x64.exe` 的后缀 `-windows-x64` 当成版本的一部分，
 * 从而把当前版本误判为旧版（这正是本脚本第一版的 bug）。
 * 边界同时也避免了 0.3.1 误配 0.3.10。
 */
function belongsToVersion(name, version) {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^0-9.])${escaped}([^0-9.]|$)`).test(name)
}

/**
 * 从文件名列表里挑出「不属于当前版本」的安装包。
 *
 * 判定规则（纯函数，便于测试）：
 * - 非安装包扩展名 → 保留。
 * - 名字里含当前版本号（按边界匹配）→ 保留。
 * - 其余安装包 → 删除。这包括旧版产物，以及 `...-latest-windows-x64.exe`
 *   这类不带版本号的稳定别名——它无法证明自己属于当前版本，留着就可能
 *   在 dist 里冒充「最新版」（0.3.9 的 latest 别名正是这么残留下来骗人的）。
 *
 * @param names - dist 顶层的文件名（不含子目录）。
 * @param version - 当前 package.json 的 version。
 * @returns 应当删除的文件名。
 */
export function staleArtifacts(names, version) {
  return names.filter(
    (name) => ARTIFACT_PATTERN.test(name) && !belongsToVersion(name, version),
  )
}

/**
 * 清掉 dist 顶层的过期安装包，保证该目录只留当前版本的产物。
 * 只处理文件，不递归、不触碰任何子目录（如 win-unpacked）。
 *
 * @param directory - 目标目录，默认仓库根的 dist。
 * @param version - 当前版本；缺省时从 package.json 读取。
 * @param dryRun - 只报告将要删除的内容，不真正删除。
 */
export function cleanDist({ directory = distDirectory, version, dryRun = false } = {}) {
  const targetVersion =
    version ?? JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version
  if (!existsSync(directory)) return { version: targetVersion, removed: [], kept: [] }

  const names = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
  const doomed = staleArtifacts(names, targetVersion)

  if (!dryRun) {
    for (const name of doomed) rmSync(path.join(directory, name), { force: true })
  }

  return {
    version: targetVersion,
    removed: doomed,
    kept: names.filter((name) => !doomed.includes(name)),
  }
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
}

if (isMainModule()) {
  const dryRun = process.argv.includes('--dry-run')
  const result = cleanDist({ dryRun })
  const prefix = dryRun ? '[clean-dist] (dry-run) 将移除' : '[clean-dist] 已移除'
  if (result.removed.length === 0) {
    console.log(`[clean-dist] dist 只含 ${result.version} 的产物，无需清理`)
  } else {
    for (const name of result.removed) console.log(`${prefix}: ${name}`)
  }
}
