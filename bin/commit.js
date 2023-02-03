#!/usr/bin/env node

import { Commiter } from "../src/commit.js";
import { PackageJSON } from "../src/package.js";
import { checkForArgs } from "../src/terminal.js";

async function main() {
	await checkForArgs(process.argv[2] ?? "fix", {
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

	const success = await Commiter.add_commit_push({ silentMode: false, arg: process.argv[2] });
	if (!success) process.exit(1);
}

main();
