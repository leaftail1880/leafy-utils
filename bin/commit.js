#!/usr/bin/env node
// @ts-check

import { Commiter } from "../src/commit.js";

async function main() {
	await Commiter.pack_package.init();
	const other_commit = Commiter.runPackageScript("commit", process.argv);
	if (other_commit !== false) return;

	const parsed = await Commiter.checkForCommitArgs();

	await Commiter.add_commit_push(parsed);
}

main();
