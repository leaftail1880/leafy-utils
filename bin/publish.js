#!/usr/bin/env node
// @ts-check

import { spawn } from "child_process";
import { Committer } from "../src/commit.js";

async function main() {
	if (await Committer.runPackageScript("publish", process.argv.slice(2)))
		return;

	const args = await Committer.parseArgs(
		"Publishes package from dir where it was called. Alias for git add/commit/push and yarn publish"
	);

	await Committer.build();
	await Committer.commit(args);

	spawn("yarn", ["publish", `--non-interactive`], {
		stdio: "inherit",
		shell: true,
	});
}

main();

