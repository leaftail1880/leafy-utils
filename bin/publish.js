#!/usr/bin/env node

import { spawn } from "child_process";
import { Commiter } from "../src/commit.js";

async function main() {
	const success = await Commiter.publish({ silentMode: false, arg: process.argv[2] });
	if (!success) process.exit(1);
	spawn("yarn", ["publish", `--non-interactive`], {
		stdio: "inherit",
		shell: true,
	});
}

main();
