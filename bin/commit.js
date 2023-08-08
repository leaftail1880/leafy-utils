#!/usr/bin/env node
// @ts-check

import { Commiter } from "../src/commit.js";

async function main() {
	if (await Commiter.runPackageScript("commit", process.argv.slice(2))) return;

	await Commiter.add_commit_push(await Commiter.checkForCommitArgs());
}

main();


