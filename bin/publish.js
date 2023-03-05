#!/usr/bin/env node
// @ts-check

import { spawn } from "child_process";
import { Commiter } from "../src/commit.js";

async function main() {
	await Commiter.pack_package.init();
	const other_commit = Commiter.runPackageScript("publish", process.argv);
	if (other_commit !== false) return;

	const parsed = await Commiter.checkForCommitArgs();

	await Commiter.build();
	await Commiter.add_commit_push(parsed);

	spawn("yarn", ["publish", `--non-interactive`], {
		stdio: "inherit",
		shell: true,
	});
}

main();
