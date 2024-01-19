import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { LeafyLogger } from './LeafyLogger.js'
import { execAsync } from './terminal.js'

export const logger = new LeafyLogger({ prefix: 'gitdeps' })

/**
 * Defines git dependency config
 * ```js
 * import { defineGitDependency } from "leafy-utils";
 *
 * export default defineGitDependency({
 * 	remote: {
 * 		url: "https://github.com/Herobrine643928/Chest-UI",
 * 		branch: "main",
 * 		path: "RP",
 * 	},
 * 	dependencies: {
 * 		"ui/": "./ui/",
 * 		"textures/": "./textures/",
 * 	},
 * });
 * ```
 * @param {import("./types.js").GitDependency} config
 */
export async function defineGitDependency(config) {
  let source = new Error().stack ?? ''
  try {
    source = source.split('\n')[2] ?? ''
    source = source.replace(/\s+at\s+(?:\w+\s+)?\(?(.+)\)?/, '$1')
    source = fileURLToPath(source)
    source = path.parse(source).name
  } catch (e) {}

  try {
    const execOptions = { cwd: process.cwd() }
    const exec = execAsync.withDefaults({}, { logger })
    const remoteName = config.remote.name || source || 'gitdep'

    const remotes = (await exec(`git remote`, { failedTo: 'get remote list' }))
      .split('\n')
      .map(e => e.trim())
      .filter(Boolean)
    if (!remotes.includes(remoteName)) {
      // Add remote
      await exec(`git remote add ${remoteName} ${config.remote.url} -f --no-tags -t=${config.remote.branch}`, {
        failedTo: 'Add remote',
        context: { remoteName, ...config.remote },
        ignore: (_, stderr) => {
          if (stderr.includes(`error: remote ${remoteName} already exists`)) {
            logger.warn(`Remote ${remoteName} already exists, skipping...`)
            return true
          }
        },
      })

      logger.success(`Initialized remote with name ${remoteName} successfully!`)
    }

    // Fetch updates
    await exec(`git fetch ${remoteName} ${config.remote.branch}`, {
      failedTo: 'fetch updates',
    })

    // Merge refs
    await exec(`git merge -s ours --no-commit ${remoteName}/${config.remote.branch}`, {
      failedTo: 'merge refs',
      ignore: (_, stderr) => stderr.includes('fatal: refusing to merge unrelated histories'),
    })

    // Get git dir
    execOptions.cwd = (
      await exec('git rev-parse --show-toplevel', {
        failedTo: 'get git dir',
      })
    ).trim()
    logger.log('Working directory:', execOptions.cwd.replace(process.cwd().replace(/\\/g, '/'), '') || '.')

    // Update files
    for (let [remote, options] of Object.entries(config.dependencies)) {
      if (typeof options === 'string') options = { localPath: options }
      if (!options.file && path.parse(options.localPath).ext) {
        logger.warn(
          `Threating '${options.localPath}' as a file. Replace ${remote} dependency to { localPath: '${options.localPath}', file: true } to remove this warning`
        )
        options.file = true
      }

      // Parse remote path relative to specified base
      const remotePath = path.join(config.remote.path ?? '', remote).replace(/\\/g, '/')

      // Parse local path relative to specified base and remove starting /
      const local = path
        .join(config.path ?? '', options.localPath)
        .replace(/\\/g, '/')
        .replace(/^\//g, '')

      logger.info('Local dependency path:', local)

      // Define temp path
      const temp = '&&_git_dep_temp_&&'

      const fullLocal = path.join(execOptions.cwd, local)
      const fullTemp = path.join(execOptions.cwd, temp)

      async function restoreStagedTemp() {
        const changes = await exec(`git status -z -uall`, {
          failedTo: 'list changed files',
        })
        if (!changes.split('\x00').find(e => e.includes('A') && e.includes(temp))) return

        await exec(`git restore --staged "${temp}/*"`, {
          failedTo: 'restore from staged',
          context: {
            changes,
            gitDir: execOptions.cwd,
            files: await fs.readdir(execOptions.cwd),
          },
        })
      }

      if (existsSync(fullTemp)) {
        // Restore them from stage
        await restoreStagedTemp()

        // Clear temp
        await fs.rm(fullTemp, {
          recursive: true,
          force: true,
        })
      }

      // Get remote file(s)
      await exec(`git read-tree --prefix="${temp}" -u "${remoteName}/${config.remote.branch}:${remotePath}"`, {
        failedTo: 'get remote files',
      })

      // Restore them from stage
      await restoreStagedTemp()

      // Merge changes
      await fs.cp(fullTemp, fullLocal, { force: true, recursive: true })
      await fs.rm(fullTemp, {
        recursive: true,
        force: true,
      })

      // Apply changes
      await restoreStagedTemp()
    }

    logger.success('Everything is up to date')
  } catch (e) {
    if (!(e instanceof execAsync.error)) logger.error(e)
  }
}
