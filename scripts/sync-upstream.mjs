import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(root, 'package.json')
const lockfilePath = path.join(root, 'package-lock.json')
const readmePaths = [
  path.join(root, 'README.md'),
  path.join(root, 'README.zh-CN.md'),
]

export function upstreamDependencyNames(manifest) {
  return Object.keys(manifest.dependencies ?? {}).filter(
    packageName => packageName === '@deepseek-ai/dsh'
      || packageName.startsWith('@deepseek-ai/dsh-'),
  )
}

/**
 * Every upstream @deepseek-ai/dsh* package the desktop host must declare
 * explicitly. DSH's internal packages reference each other through
 * peerDependencies, so a package that appears in the resolved tree but is not
 * declared here is only installed when the installer happens to resolve peers
 * (e.g. `npm install --force`). Declaring them guarantees a complete plugin tree
 * regardless of install mode — a missing one surfaces at runtime as
 * `AggregateError: loader entries failed to apply`.
 *
 * When upstream splits out a new internal package, add its name here; the sync
 * script then backfills it on the next version bump.
 */
export const REQUIRED_UPSTREAM_PACKAGES = [
  '@deepseek-ai/dsh',
  '@deepseek-ai/dsh-anonymous-user-id',
  '@deepseek-ai/dsh-atomic-write',
  '@deepseek-ai/dsh-attachment',
  '@deepseek-ai/dsh-authorization',
  '@deepseek-ai/dsh-bash-local',
  '@deepseek-ai/dsh-code-runtime',
  '@deepseek-ai/dsh-compaction',
  '@deepseek-ai/dsh-fs',
  '@deepseek-ai/dsh-hook-protocol',
  '@deepseek-ai/dsh-invariants',
  '@deepseek-ai/dsh-jobs',
  '@deepseek-ai/dsh-output-retention',
  '@deepseek-ai/dsh-sandbox',
  '@deepseek-ai/dsh-scope',
  '@deepseek-ai/dsh-sdk-protocol',
  '@deepseek-ai/dsh-session-persistence',
  '@deepseek-ai/dsh-session-query',
  '@deepseek-ai/dsh-session-telemetry',
  '@deepseek-ai/dsh-session-title-llm',
  '@deepseek-ai/dsh-settings',
  '@deepseek-ai/dsh-shell',
  '@deepseek-ai/dsh-spill',
  '@deepseek-ai/dsh-subagent-in-process-driver',
  '@deepseek-ai/dsh-subprocess',
  '@deepseek-ai/dsh-timeout',
  '@deepseek-ai/dsh-util-time',
  '@deepseek-ai/dsh-util-workspace-path',
  '@deepseek-ai/dsh-workflow',
]

export function updateUpstreamDependencies(manifest, targetVersion, {
  requiredPackages = REQUIRED_UPSTREAM_PACKAGES,
} = {}) {
  const declared = upstreamDependencyNames(manifest)
  if (!declared.includes('@deepseek-ai/dsh')) {
    throw new Error('package.json does not declare @deepseek-ai/dsh')
  }

  const currentVersion = manifest.dependencies['@deepseek-ai/dsh']
  for (const packageName of declared) {
    if (manifest.dependencies[packageName] !== currentVersion) {
      throw new Error(
        `${packageName} is pinned to ${manifest.dependencies[packageName]}, expected ${currentVersion}`,
      )
    }
  }

  for (const packageName of declared) {
    manifest.dependencies[packageName] = targetVersion
  }

  // Backfill upstream packages that are required by the host but were never
  // declared — the gap the old "only bump existing pins" logic could not see.
  const added = []
  for (const packageName of requiredPackages) {
    if (manifest.dependencies[packageName] === undefined) {
      manifest.dependencies[packageName] = targetVersion
      added.push(packageName)
    }
  }

  const packageNames = [...new Set([...declared, ...requiredPackages])]
  return { currentVersion, packageNames, added }
}

export function updateReadmeVersion(source, currentVersion, targetVersion) {
  return source.replaceAll(
    `@deepseek-ai/dsh@${currentVersion}`,
    `@deepseek-ai/dsh@${targetVersion}`,
  )
}

function parseSemver(version) {
  const match = /^(?:v)?(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.exec(version)
  if (!match?.groups) throw new Error(`Invalid semantic version: ${version}`)
  return {
    core: [
      Number(match.groups.major),
      Number(match.groups.minor),
      Number(match.groups.patch),
    ],
    prerelease: match.groups.prerelease?.split('.') ?? [],
  }
}

export function compareSemver(leftVersion, rightVersion) {
  const left = parseSemver(leftVersion)
  const right = parseSemver(rightVersion)
  for (let index = 0; index < left.core.length; index += 1) {
    if (left.core[index] !== right.core[index]) {
      return left.core[index] > right.core[index] ? 1 : -1
    }
  }
  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    if (left.prerelease.length === right.prerelease.length) return 0
    return left.prerelease.length === 0 ? 1 : -1
  }
  const length = Math.max(left.prerelease.length, right.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const leftIdentifier = left.prerelease[index]
    const rightIdentifier = right.prerelease[index]
    if (leftIdentifier === undefined || rightIdentifier === undefined) {
      return leftIdentifier === undefined ? -1 : 1
    }
    if (leftIdentifier === rightIdentifier) continue
    const leftNumeric = /^\d+$/.test(leftIdentifier)
    const rightNumeric = /^\d+$/.test(rightIdentifier)
    if (leftNumeric && rightNumeric) {
      return Number(leftIdentifier) > Number(rightIdentifier) ? 1 : -1
    }
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1
    return leftIdentifier > rightIdentifier ? 1 : -1
  }
  return 0
}

export function validateLockfile(lockfile, packageNames, targetVersion) {
  const rootPackage = lockfile.packages?.['']
  if (!rootPackage) throw new Error('package-lock.json has no root package')

  for (const packageName of packageNames) {
    if (rootPackage.dependencies?.[packageName] !== targetVersion) {
      throw new Error(`package-lock.json root dependency ${packageName} was not updated`)
    }
    const installedVersion = lockfile.packages?.[`node_modules/${packageName}`]?.version
    if (installedVersion !== targetVersion) {
      throw new Error(
        `package-lock.json resolved ${packageName}@${installedVersion ?? 'missing'}, expected ${targetVersion}`,
      )
    }
  }
}

function npmLatestVersion() {
  const raw = execFileSync(
    'npm',
    ['view', '@deepseek-ai/dsh', 'dist-tags.latest', '--json'],
    { cwd: root, encoding: 'utf8' },
  )
  return JSON.parse(raw)
}

function writeOutput(values) {
  const outputPath = process.env.GITHUB_OUTPUT
  if (!outputPath) return
  appendFileSync(
    outputPath,
    Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''),
  )
}

function requestedVersion() {
  const argumentIndex = process.argv.indexOf('--version')
  if (argumentIndex !== -1) {
    const value = process.argv[argumentIndex + 1]
    if (!value) throw new Error('--version requires a value')
    return value
  }
  return process.env.DSH_TARGET_VERSION || npmLatestVersion()
}

function sync() {
  const targetVersion = requestedVersion()
  if (typeof targetVersion !== 'string' || !/^[0-9A-Za-z][0-9A-Za-z.+-]*$/.test(targetVersion)) {
    throw new Error(`Invalid upstream version: ${targetVersion}`)
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const currentVersion = manifest.dependencies?.['@deepseek-ai/dsh']
  const comparison = compareSemver(targetVersion, currentVersion)
  if (comparison === 0) {
    process.stdout.write(`DeepSeek Harness is already current at ${currentVersion}.\n`)
    writeOutput({ updated: false, current_version: currentVersion, target_version: targetVersion })
    return
  }
  if (comparison < 0) {
    process.stdout.write(
      `Ignoring older DeepSeek Harness version ${targetVersion}; current pin is ${currentVersion}.\n`,
    )
    writeOutput({ updated: false, current_version: currentVersion, target_version: targetVersion })
    return
  }

  const { packageNames, added } = updateUpstreamDependencies(manifest, targetVersion)
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  if (added.length > 0) {
    process.stdout.write(
      `Backfilled upstream packages newly required by the desktop: ${added.join(', ')}\n`,
    )
  }

  for (const readmePath of readmePaths) {
    const source = readFileSync(readmePath, 'utf8')
    writeFileSync(readmePath, updateReadmeVersion(source, currentVersion, targetVersion))
  }

  // --force: dshmarket's peerOptional range lags the DSH release train (see
  // .npmrc); without it the peer conflict aborts lockfile regeneration.
  execFileSync(
    'npm',
    ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund', '--force'],
    { cwd: root, stdio: 'inherit' },
  )

  const lockfile = JSON.parse(readFileSync(lockfilePath, 'utf8'))
  validateLockfile(lockfile, packageNames, targetVersion)
  process.stdout.write(`Updated DeepSeek Harness from ${currentVersion} to ${targetVersion}.\n`)
  writeOutput({ updated: true, current_version: currentVersion, target_version: targetVersion })
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
}

if (isMainModule()) sync()
