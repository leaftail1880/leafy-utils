#!/usr/bin/env node

import { Commiter } from "../src/commit.js";

async function main() {
	const success = await Commiter.add_commit_push({ silentMode: false, arg: process.argv[2] });
	if (!success) process.exit(1);
}

main();
