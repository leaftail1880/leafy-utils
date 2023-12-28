#!/usr/bin/env node
// @ts-check

import { Committer } from '../src/commit.js'

async function main() {
  if (await Committer.runPackageScript('commit', process.argv.slice(2))) return

  await Committer.commit(await Committer.parseArgs())
}

main()
