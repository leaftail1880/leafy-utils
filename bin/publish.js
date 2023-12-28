#!/usr/bin/env node
// @ts-check

import { spawn } from 'child_process'
import { Committer } from '../src/commit.js'

async function main() {
  if (await Committer.runPackageScript('publish', process.argv.slice(2))) return

  const args = await Committer.parseArgs(
    'Publishes package from dir where it was called. Alias for git add/commit/push and yarn publish',
    `
  --publishCommand | -c - Command to run after build and commit, e.g. yarn publish for v3 or yarn npm publish for v4
	-y - Shorhand for --publishCommand="yarn publish npm"
	-n - Shorhand for --publishCommand="npm publish"
		`,
    {
      publishCommand: {
        type: 'string',
        short: 'c',
      },
      y: {
        type: 'boolean',
        short: 'y',
      },
      n: {
        type: 'boolean',
        short: 'n',
      },
    }
  )

  await Committer.build()
  await Committer.commit(args)

  if (args.options.n) args.options.publishCommand = 'npm publish'
  if (args.options.y) args.options.publishCommand = 'yarn npm publish'
  spawn(args.options.publishCommand ?? 'yarn publish --non-interactive', {
    stdio: 'inherit',
    shell: true,
  })
}

main()
