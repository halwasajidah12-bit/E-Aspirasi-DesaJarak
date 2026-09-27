import { execFileSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const appDirectory = join(root, 'DesaJarak')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

// Rollup's native package is platform-specific. Reinstall the nested app on
// the target machine so Railway gets its Linux optional dependency.
rmSync(join(appDirectory, 'node_modules'), { recursive: true, force: true })
rmSync(join(appDirectory, 'package-lock.json'), { force: true })

execFileSync(npmCommand, ['install', '--include=dev', '--include=optional', '--no-audit', '--no-fund'], {
  cwd: appDirectory,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
execFileSync(npmCommand, ['run', 'build'], {
  cwd: appDirectory,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})