#!/usr/bin/env node
// @ts-check

import { spawn } from "child_process";
import { Commiter } from "../src/commit.js";
import { PackageJSON } from "../src/package.js";
import { checkForArgs } from "../src/terminal.js";

async function main() {
	const parsed = await checkForArgs(
		{
			async package() {
				const pack_package = new PackageJSON();
				await pack_package.init();
				console.log(pack_package.data);
				return 1;
			},
		},
		{ commandList: ["fix", "update", "release"], defaultCommand: "fix" }
	);

	await Commiter.build();
	await Commiter.add_commit_push({
		type: parsed.command,
		info: parsed.raw_input,
	});

	spawn("yarn", ["publish", `--non-interactive`], {
		stdio: "inherit",
		shell: true,
	});
}

main();
