#!/usr/bin/env node
// @ts-check

import { spawn } from "child_process";
import { Commiter } from "../src/commit.js";

async function main() {
	if (await Commiter.runPackageScript("publish", process.argv.slice(2))) return;

	const args = await Commiter.checkForCommitArgs(
		"Publishes package from dir where it was called. Alias for git commit and yarn publish"
	);

	await Commiter.build();
	await Commiter.add_commit_push(args);

	spawn("yarn", ["publish", `--non-interactive`], {
		stdio: "inherit",
		shell: true,
	});
}

main();




