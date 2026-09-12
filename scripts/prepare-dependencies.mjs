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
const dshManifestPath = path.join(root, 'node_modules', '@deepseek-ai', 'dsh', 'package.json')
const windowsNodePath = path.join(root, 'assets', 'dsh-node.exe')
const nodeLicensePath = path.join(root, 'third-party-licenses', 'nodejs-LICENSE')
const DSH_MARKET_VERSION = '1.45.1'

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

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
}

if (isMainModule()) {
  prepareApiProxy()
  prepareSettingsMarketNavIcon()
  prepareDshManifest()
  prepareWindowsNode()
}
