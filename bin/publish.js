#!/usr/bin/env node

import { spawn } from "child_process";
import { Commiter } from "../src/commit.js";
import { checkForArgs } from "../src/terminal.js";

async function main() {
	const args = await checkForArgs(process.argv[2] ?? "fix", {
		fix() {},
		update() {},
		release() {},
		async package() {
			const pack_package = new PackageJSON();
			await pack_package.init();
			console.log(pack_package.data);
			return 0;
		},
	});

	const success = await Commiter.publish({
		silentMode: false,
		type: args.command,
		info: args.args.join(""),
		searchCommitScript: true,
	});
	if (success !== 0) process.exit(success);
	spawn("yarn", ["publish", `--non-interactive`], {
		stdio: "inherit",
		shell: true,
	});
}

main();
