#!/usr/bin/env node

import { Commiter } from "../src/commit.js";
import { PackageJSON } from "../src/package.js";
import { checkForArgs, exit } from "../src/terminal.js";

async function main() {
	const e = () => void 0;
	process.argv[2] ??= "fix";
	const parsed = await checkForArgs({
		f: e,
		u: e,
		r: e,
		// r
		// y
		fix: e,
		update: e,
		release: e,
		async package() {
			const pack_package = new PackageJSON();
			await pack_package.init();
			console.log(pack_package.data);
			return 1;
		},
	});

	const status = await Commiter.add_commit_push({
		silentMode: false,
		type: parsed.command,
		info: parsed.raw_input,
		searchCommitScript: true,
	});
	exit(status);
}

main();
