import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiProxyPath = path.join(
  root,
  'node_modules',
  '@deepseek-ai',
  'dsh-host-apiproxy',
  'lib',
  'index.js',
)
const settingsGeneralClientPath = path.join(
  root,
  'node_modules',
  '@deepseek-ai',
  'dsh-client-ui-settings-general',
  'lib',
  'client.js',
)
const permissionPresetsClientPath = path.join(
  root,
  'node_modules',
  '@deepseek-ai',
  'dsh-client-ui-permission-presets',
  'lib',
  'client.js',
)
const dshManifestPath = path.join(root, 'node_modules', '@deepseek-ai', 'dsh', 'package.json')
const windowsNodePath = path.join(root, 'assets', 'dsh-node.exe')
const nodeLicensePath = path.join(root, 'third-party-licenses', 'nodejs-LICENSE')
export const DSH_MARKET_VERSION = '1.45.1'

// ── auto-approve 权限预设图标补丁 ──────────────────────────────────────────
// 会话权限下拉的 glyphs 表（dsh-client-ui-conversation）只登记了三个内置预设：
// read-only / workspace-write / danger-full-access。第三方权限预设（例如
// dsh-approval-gate 提供的 auto-approve）取不到 glyph，下拉项就没有图标。
// 这里以 danger-full-access 图标的感叹号 path 为锚点，取其数组项结尾插入
// 一个同风格的「盾牌 + 闪电」图标（闪电呼应 Flash 判定）。
const AUTO_APPROVE_GLYPH_MARK = '["auto-approve"'
const FULL_ACCESS_GLYPH_ANCHOR = 'M9.10094 9.8114V11.5H7.59888V9.8114H9.10094Z'
const ITEM_TAIL = '\t\t\t})]'
const MAP_TAIL = ITEM_TAIL + '\n\t\t]);'
const AUTO_APPROVE_GLYPH_ENTRY = `,
			["auto-approve", (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": true,
				children: [(0, react_jsx_runtime.jsx)("path", {
					d: _deepseek_ai_dsh_client_ui_primitives.SHIELD_OUTLINE_PATH,
					stroke: "currentColor",
					strokeWidth: _deepseek_ai_dsh_client_ui_primitives.SHIELD_OUTLINE_STROKE,
					strokeLinejoin: "round"
				}), (0, react_jsx_runtime.jsx)("path", {
					d: "M9.8 4L6.4 8.7H8.1L7 11.9L10.5 7.2H8.7L9.8 4Z",
					fill: "currentColor"
				})]
			})]`

const ORIGINAL_WINDOWS_OPENER = `async function openWindowsPath(path, signal, run) {
\tawait run("powershell.exe", [
\t\t"-NoProfile",
\t\t"-Command",
\t\t\`Invoke-Item -LiteralPath \${powershellLiteral(path)}\`
\t], signal);
}`

const PATCHED_WINDOWS_OPENER = `async function openWindowsPath(path, signal, run) {
\tconst command = \`Invoke-Item -LiteralPath \${powershellLiteral(path)}\`;
\tconst encodedCommand = Buffer.from(command, "utf16le").toString("base64");
\tawait run("powershell.exe", [
\t\t"-NoLogo",
\t\t"-NoProfile",
\t\t"-NonInteractive",
\t\t"-EncodedCommand",
\t\tencodedCommand
\t], signal);
}`

const SETTINGS_NAV_ICON_START = `\t\tfunction navIcon(id) {
\t\t\tif (id === "models")`

const MARKET_NAV_ICON = `\t\tfunction navIcon(id) {
\t\t\tif (id === "market") return (0, react_jsx_runtime.jsxs)("svg", {
\t\t\t\tclassName: SettingsRoot_module_css_default.navIcon,
\t\t\t\twidth: 16,
\t\t\t\theight: 16,
\t\t\t\tviewBox: "0 0 16 16",
\t\t\t\tfill: "none",
\t\t\t\t"aria-hidden": "true",
\t\t\t\tchildren: [(0, react_jsx_runtime.jsxs)("g", {
\t\t\t\t\tfill: "currentColor",
\t\t\t\t\tchildren: [(0, react_jsx_runtime.jsx)("rect", {
\t\t\t\t\t\tx: "1.96",
\t\t\t\t\t\ty: "3.36",
\t\t\t\t\t\twidth: "3.3",
\t\t\t\t\t\theight: "3.3",
\t\t\t\t\t\trx: "0.53"
\t\t\t\t\t}), (0, react_jsx_runtime.jsx)("rect", {
\t\t\t\t\t\tx: "5.71",
\t\t\t\t\t\ty: "3.36",
\t\t\t\t\t\twidth: "3.3",
\t\t\t\t\t\theight: "3.3",
\t\t\t\t\t\trx: "0.53"
\t\t\t\t\t}), (0, react_jsx_runtime.jsx)("rect", {
\t\t\t\t\t\tx: "1.96",
\t\t\t\t\t\ty: "7.11",
\t\t\t\t\t\twidth: "3.3",
\t\t\t\t\t\theight: "3.3",
\t\t\t\t\t\trx: "0.53"
\t\t\t\t\t}), (0, react_jsx_runtime.jsx)("rect", {
\t\t\t\t\t\tx: "5.71",
\t\t\t\t\t\ty: "7.11",
\t\t\t\t\t\twidth: "3.3",
\t\t\t\t\t\theight: "3.3",
\t\t\t\t\t\trx: "0.53"
\t\t\t\t\t}), (0, react_jsx_runtime.jsx)("rect", {
\t\t\t\t\t\tx: "9.46",
\t\t\t\t\t\ty: "7.11",
\t\t\t\t\t\twidth: "3.3",
\t\t\t\t\t\theight: "3.3",
\t\t\t\t\t\trx: "0.53"
\t\t\t\t\t}), (0, react_jsx_runtime.jsx)("rect", {
\t\t\t\t\t\tx: "1.96",
\t\t\t\t\t\ty: "10.86",
\t\t\t\t\t\twidth: "3.3",
\t\t\t\t\t\theight: "3.3",
\t\t\t\t\t\trx: "0.53"
\t\t\t\t\t}), (0, react_jsx_runtime.jsx)("rect", {
\t\t\t\t\t\tx: "5.71",
\t\t\t\t\t\ty: "10.86",
\t\t\t\t\t\twidth: "3.3",
\t\t\t\t\t\theight: "3.3",
\t\t\t\t\t\trx: "0.53"
\t\t\t\t\t}), (0, react_jsx_runtime.jsx)("rect", {
\t\t\t\t\t\tx: "9.46",
\t\t\t\t\t\ty: "10.86",
\t\t\t\t\t\twidth: "3.3",
\t\t\t\t\t\theight: "3.3",
\t\t\t\t\t\trx: "0.53"
\t\t\t\t\t})]
\t\t\t\t}), (0, react_jsx_runtime.jsx)("rect", {
\t\t\t\t\tx: "10.74",
\t\t\t\t\ty: "2.09",
\t\t\t\t\twidth: "3.3",
\t\t\t\t\theight: "3.3",
\t\t\t\t\trx: "0.53",
\t\t\t\t\tfill: "currentColor",
\t\t\t\t\ttransform: "rotate(9 12.39 3.74)"
\t\t\t\t})]
\t\t\t});
\t\t\tif (id === "models")`

export function encodeWindowsOpenCommand(targetPath) {
  const literal = `'${targetPath.replaceAll("'", "''")}'`
  const command = `Invoke-Item -LiteralPath ${literal}`
  return Buffer.from(command, 'utf16le').toString('base64')
}

export function patchWindowsPathOpener(source) {
  if (source.includes(PATCHED_WINDOWS_OPENER)) return source
  const matches = source.split(ORIGINAL_WINDOWS_OPENER).length - 1
  if (matches !== 1) {
    throw new Error(`Expected exactly one DeepSeek Harness Windows path opener, found ${matches}`)
  }
  return source.replace(ORIGINAL_WINDOWS_OPENER, PATCHED_WINDOWS_OPENER)
}

export function prepareApiProxy(target = apiProxyPath) {
  // 兼容性：@deepseek-ai/dsh-host-apiproxy 在 0.1.1-rc.2 之后不再发布，DSH 0.1.2+
  // 生态中不再安装该包（相关能力由上游重构，如 @deepseek-ai/dsh-http-proxy）。
  // 目标缺失时优雅跳过，避免 npm install 的 postinstall 中断。
  if (!existsSync(target)) {
    console.log(
      '[prepare-dependencies] 跳过 apiproxy Windows opener 补丁：目标不存在（新版 DSH 已不再提供该包）',
    )
    return
  }
  const source = readFileSync(target, 'utf8')
  const patched = patchWindowsPathOpener(source)
  if (patched !== source) writeFileSync(target, patched)
}

export function patchSettingsMarketNavIcon(source) {
  if (source.includes(MARKET_NAV_ICON)) return source
  const matches = source.split(SETTINGS_NAV_ICON_START).length - 1
  if (matches !== 1) {
    throw new Error(`Expected exactly one DeepSeek Harness settings nav icon function, found ${matches}`)
  }
  return source.replace(SETTINGS_NAV_ICON_START, MARKET_NAV_ICON)
}

export function prepareSettingsMarketNavIcon(target = settingsGeneralClientPath) {
  if (!existsSync(target)) {
    console.log('[prepare-dependencies] 跳过设置页市场图标补丁：目标不存在')
    return
  }
  const source = readFileSync(target, 'utf8')
  let patched
  try {
    patched = patchSettingsMarketNavIcon(source)
  } catch (err) {
    // 上游源码结构变化时不影响安装：仅提示（市场入口图标可能不显示，其余功能正常）
    console.log(
      `[prepare-dependencies] 跳过设置页市场图标补丁：${err && err.message ? err.message : String(err)}`,
    )
    return
  }
  if (patched !== source) writeFileSync(target, patched)
}

export function patchDshManifest(source) {
  const manifest = JSON.parse(source)
  if (manifest.name !== '@deepseek-ai/dsh' || typeof manifest.dependencies !== 'object') {
    throw new Error('Expected the @deepseek-ai/dsh package manifest')
  }
  if (manifest.dependencies.dshmarket === DSH_MARKET_VERSION) return source
  manifest.dependencies.dshmarket = DSH_MARKET_VERSION
  return `${JSON.stringify(manifest, null, 2)}\n`
}

export function prepareDshManifest(target = dshManifestPath) {
  if (!existsSync(target)) {
    console.log('[prepare-dependencies] 跳过 dsh 清单补丁：目标不存在')
    return
  }
  const source = readFileSync(target, 'utf8')
  let patched
  try {
    patched = patchDshManifest(source)
  } catch (err) {
    console.log(
      `[prepare-dependencies] 跳过 dsh 清单补丁：${err && err.message ? err.message : String(err)}`,
    )
    return
  }
  if (patched !== source) writeFileSync(target, patched)
}

export function findNodeLicense(executablePath = process.execPath) {
  const executableDirectory = path.dirname(executablePath)
  const candidates = [
    path.join(executableDirectory, 'LICENSE'),
    path.join(executableDirectory, 'LICENSE.md'),
    path.join(executableDirectory, '..', 'LICENSE'),
  ]
  return candidates.find(existsSync)
}

export function prepareWindowsNode({
  platform = process.platform,
  executablePath = process.execPath,
  outputPath = windowsNodePath,
  licenseOutputPath = nodeLicensePath,
} = {}) {
  if (platform !== 'win32') return

  // 先复制运行时（功能必需）。部分 Node 安装（精简/绿色包）不自带 LICENSE，
  // 此时只告警不中断安装；发布打包前可自行补齐该合规文件。
  mkdirSync(path.dirname(outputPath), { recursive: true })
  copyFileSync(executablePath, outputPath)

  const licensePath = findNodeLicense(executablePath)
  if (!licensePath) {
    console.log(
      `[prepare-dependencies] 未在 ${executablePath} 旁找到 Node.js LICENSE，已跳过 third-party-licenses/nodejs-LICENSE（打包发布前请补齐）`,
    )
    return
  }
  mkdirSync(path.dirname(licenseOutputPath), { recursive: true })
  copyFileSync(licensePath, licenseOutputPath)
}

/**
 * 为第三方权限预设 auto-approve 注入下拉图标。幂等；锚点漂移时抛错，
 * 由调用方决定是告警还是中断（安装期的 preparePermissionGlyph 记日志跳过）。
 *
 * DSH 0.1.6 把这张 glyph 表从 dsh-client-ui-conversation 搬到了
 * dsh-client-ui-permission-presets，并改用 primitives 常量引用。锚点漂移
 * 必须显式报出来，否则补丁会静默失效、图标悄悄消失。
 * @param source - dsh-client-ui-permission-presets 的 client.js 源码。
 * @returns 打过补丁的源码。
 */
export function patchPermissionGlyph(source) {
  if (source.includes(AUTO_APPROVE_GLYPH_MARK)) return source
  const anchorIdx = source.indexOf(FULL_ACCESS_GLYPH_ANCHOR)
  if (anchorIdx < 0) {
    throw new Error('Expected the full-access permission glyph in dsh-client-ui-permission-presets')
  }
  const tailIdx = source.indexOf(MAP_TAIL, anchorIdx)
  if (tailIdx < 0) {
    throw new Error('Expected the permission glyph map tail after the full-access glyph')
  }
  const insertAt = tailIdx + ITEM_TAIL.length
  return source.slice(0, insertAt) + AUTO_APPROVE_GLYPH_ENTRY + source.slice(insertAt)
}

export function preparePermissionGlyph(target = permissionPresetsClientPath) {
  if (!existsSync(target)) {
    console.log('[prepare-dependencies] 跳过权限预设图标补丁：目标不存在')
    return
  }
  const source = readFileSync(target, 'utf8')
  let patched
  try {
    patched = patchPermissionGlyph(source)
  } catch (err) {
    // 上游结构变化时不阻断安装：仅提示（auto-approve 预设可能没有下拉图标）
    console.log(
      `[prepare-dependencies] 跳过权限预设图标补丁：${err && err.message ? err.message : String(err)}`,
    )
    return
  }
  if (patched !== source) writeFileSync(target, patched)
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
}

if (isMainModule()) {
  prepareApiProxy()
  prepareSettingsMarketNavIcon()
  preparePermissionGlyph()
  prepareDshManifest()
  prepareWindowsNode()
}
