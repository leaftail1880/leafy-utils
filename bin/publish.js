#!/usr/bin/env node

import { spawn } from "child_process";
import { Commiter } from "../src/commit.js";
import { checkForArgs } from "../src/terminal.js";

async function main() {
	process.argv[2] ??= "fix";
	const parsed = await checkForArgs({
		fix() {},
		update() {},
		release() {},
		async package() {
			const pack_package = new PackageJSON();
			await pack_package.init();
			console.log(pack_package.data);
			return 1;
		},
	});

	const success = await Commiter.publish({
		silentMode: false,
		type: parsed.command,
		info: parsed.raw_input,
		searchCommitScript: true,
	});
	if (success !== 0) process.exit(success);
	spawn("yarn", ["publish", `--non-interactive`], {
		stdio: "inherit",
		shell: true,
	});
}

main();
