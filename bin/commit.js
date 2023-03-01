#!/usr/bin/env node

import { Commiter } from "../src/commit.js";
import { PackageJSON } from "../src/package.js";
import { checkForArgs, exit } from "../src/terminal.js";

async function main() {
	const e = () => void 0;
	const args = await checkForArgs(process.argv[2] ?? "fix", {
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
			return 0;
		},
	});

	const status = await Commiter.add_commit_push({
		silentMode: false,
		type: args.command,
		info: args.args.join(""),
		searchCommitScript: true,
	});
	exit(status);
}

main();
