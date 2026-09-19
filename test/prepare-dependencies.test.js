import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DSH_MARKET_VERSION,
  encodeWindowsOpenCommand,
  patchDshManifest,
  patchPermissionGlyph,
  patchSettingsMarketNavIcon,
  patchWindowsPathOpener,
} from '../scripts/prepare-dependencies.mjs'

const ORIGINAL = `async function openWindowsPath(path, signal, run) {
\tawait run("powershell.exe", [
\t\t"-NoProfile",
\t\t"-Command",
\t\t\`Invoke-Item -LiteralPath \${powershellLiteral(path)}\`
\t], signal);
}`

test('Windows path opener uses a UTF-16LE encoded PowerShell command', () => {
  const encoded = encodeWindowsOpenCommand("C:\\项目\\Steven's file.txt")
  assert.equal(
    Buffer.from(encoded, 'base64').toString('utf16le'),
    "Invoke-Item -LiteralPath 'C:\\项目\\Steven''s file.txt'",
  )
})

test('dependency patch replaces exactly the pinned Windows path opener', () => {
  const patched = patchWindowsPathOpener(`before\n${ORIGINAL}\nafter`)
  assert.match(patched, /Buffer\.from\(command, "utf16le"\)/)
  assert.match(patched, /"-EncodedCommand"/)
  assert.doesNotMatch(patched, /"-Command",/)
  assert.equal(patchWindowsPathOpener(patched), patched)
})

test('dependency patch fails loudly when upstream implementation drifts', () => {
  assert.throws(
    () => patchWindowsPathOpener('async function openWindowsPath() {}'),
    /Expected exactly one/,
  )
})

test('settings market nav uses the same block-grid logo as the market heading', () => {
  const source = `before
\t\tfunction navIcon(id) {
\t\t\tif (id === "models") return modelIcon
\t\t}
after`
  const patched = patchSettingsMarketNavIcon(source)
  assert.match(patched, /if \(id === "market"\)/)
  assert.match(patched, /viewBox: "0 0 16 16"/)
  assert.match(patched, /transform: "rotate\(9 12\.39 3\.74\)"/)
  assert.match(patched, /if \(id === "models"\) return modelIcon/)
  assert.equal(patchSettingsMarketNavIcon(patched), patched)
})

test('settings market nav patch fails loudly when upstream implementation drifts', () => {
  assert.throws(
    () => patchSettingsMarketNavIcon('function navIcon() {}'),
    /Expected exactly one/,
  )
})

test('DSH dependency fallback includes the bundled plugin market', () => {
  const source = JSON.stringify({
    name: '@deepseek-ai/dsh',
    dependencies: {
      commander: '^15.0.0',
    },
  }, null, 2)
  const patched = patchDshManifest(source)
  assert.deepEqual(JSON.parse(patched).dependencies, {
    commander: '^15.0.0',
    dshmarket: DSH_MARKET_VERSION,
  })
  assert.equal(patchDshManifest(patched), patched)
})

// 模拟 DSH 0.1.6 的 permission glyph Map：制表符缩进，最后一项是 FULL_ACCESS_PRESET。
// 这张表在 0.1.6 从 dsh-client-ui-conversation 搬到了 dsh-client-ui-permission-presets。
const PERMISSION_SOURCE = `\t\tconst permissionGlyphs = new Map([
\t\t\t["read-only", (0, react_jsx_runtime.jsxs)("svg", {
\t\t\t\tchildren: [(0, react_jsx_runtime.jsx)("path", {
\t\t\t\t\td: _deepseek_ai_dsh_client_ui_primitives.SHIELD_OUTLINE_PATH,
\t\t\t\t\tstroke: "currentColor"
\t\t\t\t})]
\t\t\t})],
\t\t\t[FULL_ACCESS_PRESET, (0, react_jsx_runtime.jsxs)("svg", {
\t\t\t\tchildren: [(0, react_jsx_runtime.jsx)("path", {
\t\t\t\t\td: "M9.10094 4.5V8.75939H7.59888V4.5H9.10094Z",
\t\t\t\t\tfill: "currentColor"
\t\t\t\t}), (0, react_jsx_runtime.jsx)("path", {
\t\t\t\t\td: "M9.10094 9.8114V11.5H7.59888V9.8114H9.10094Z",
\t\t\t\t\tfill: "currentColor"
\t\t\t\t})]
\t\t\t})]
\t\t]);`

test('permission glyph patch appends the auto-approve entry inside the glyph map', () => {
  const patched = patchPermissionGlyph(PERMISSION_SOURCE)
  assert.match(patched, /\["auto-approve"/)
  assert.match(patched, /M9\.8 4L6\.4 8\.7H8\.1L7 11\.9/)
  // 注入必须落在 Map 内部：auto-approve 项之后紧跟 Map 的收尾
  assert.match(patched, /\["auto-approve"[\s\S]*\t\t\t\}\)\]\n\t\t\]\);/)
  // 原有成员不能丢
  assert.match(patched, /\["read-only"/)
  assert.match(patched, /\[FULL_ACCESS_PRESET/)
  // 幂等
  assert.equal(patchPermissionGlyph(patched), patched)
})

test('permission glyph patch fails loudly when upstream implementation drifts', () => {
  assert.throws(
    () => patchPermissionGlyph('const permissionGlyphs = new Map([])'),
    /Expected the full-access permission glyph/,
  )
})
