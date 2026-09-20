import assert from 'node:assert/strict'
import test from 'node:test'

import { staleArtifacts } from '../scripts/clean-dist.mjs'

test('staleArtifacts removes installers belonging to other versions', () => {
  const names = [
    'DeepSeek-Harness-Desktop-0.3.9-windows-x64.exe',
    'DeepSeek-Harness-Desktop-0.3.9-windows-x64.exe.blockmap',
    'DeepSeek-Harness-Desktop-0.3.9-windows-x64.zip',
    'DeepSeek-Harness-Desktop-0.3.10-windows-x64.exe',
    'DeepSeek-Harness-Desktop-0.3.10-windows-x64.exe.blockmap',
    'DeepSeek-Harness-Desktop-0.3.10-windows-x64.zip',
  ]

  assert.deepEqual(staleArtifacts(names, '0.3.10'), [
    'DeepSeek-Harness-Desktop-0.3.9-windows-x64.exe',
    'DeepSeek-Harness-Desktop-0.3.9-windows-x64.exe.blockmap',
    'DeepSeek-Harness-Desktop-0.3.9-windows-x64.zip',
  ])
})

test('staleArtifacts removes unversioned latest aliases', () => {
  // 稳定别名不带版本号，无法证明属于当前版本，必须清掉——
  // 否则 dist 里会出现「名字叫 latest、内容却是旧版」的产物。
  const names = [
    'DeepSeek-Harness-Desktop-latest-windows-x64.exe',
    'DeepSeek-Harness-Desktop-latest-windows-x64.zip',
    'DeepSeek-Harness-Desktop-latest-arm64.dmg',
  ]

  assert.deepEqual(staleArtifacts(names, '0.3.10'), names)
})

test('staleArtifacts keeps every current-version format and non-artifacts', () => {
  const names = [
    'DeepSeek-Harness-Desktop-0.3.10-windows-x64.exe',
    'DeepSeek-Harness-Desktop-0.3.10-windows-x64.zip',
    'DeepSeek-Harness-Desktop-0.3.10-arm64.dmg',
    'DeepSeek-Harness-Desktop-0.3.10-x64.dmg',
    'DeepSeek-Harness-Desktop-0.3.10-linux-x86_64.AppImage',
    'DeepSeek-Harness-Desktop-0.3.10-linux-amd64.deb',
    'latest.yml',
    'builder-debug.yml',
    'win-unpacked',
  ]

  assert.deepEqual(staleArtifacts(names, '0.3.10'), [])
})

test('staleArtifacts handles prerelease versions exactly', () => {
  const names = [
    'app-0.1.5-rc.2-arm64.dmg',
    'app-0.1.6-alpha.2-arm64.dmg',
  ]

  assert.deepEqual(staleArtifacts(names, '0.1.6-alpha.2'), ['app-0.1.5-rc.2-arm64.dmg'])
})

test('staleArtifacts keeps current-version artifacts whose name continues with suffixes', () => {
  // 回归用例：第一版实现用贪婪正则从文件名反解版本号，把 `-windows-x64`
  // 当成了版本后缀，于是 `0.3.10-windows-x64` !== `0.3.10`，
  // 当前版本的安装包被误判成过期而删掉。
  const names = [
    'DeepSeek-Harness-Desktop-0.3.10-windows-x64.exe',
    'DeepSeek-Harness-Desktop-0.3.10-windows-x64.exe.blockmap',
    'DeepSeek-Harness-Desktop-0.3.10-windows-x64.zip',
    'DeepSeek-Harness-Desktop-0.3.10-linux-x86_64.AppImage',
  ]

  assert.deepEqual(staleArtifacts(names, '0.3.10'), [])
})

test('staleArtifacts does not confuse 0.3.1 with 0.3.10', () => {
  // 边界匹配：短版本号不能被长版本号包含进去。
  assert.deepEqual(staleArtifacts(['app-0.3.1-win.exe'], '0.3.10'), ['app-0.3.1-win.exe'])
  assert.deepEqual(staleArtifacts(['app-0.3.10-win.exe'], '0.3.1'), ['app-0.3.10-win.exe'])
})
