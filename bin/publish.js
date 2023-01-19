#!/usr/bin/env node

import { Commiter } from "../src/commit.js";

async function main() {
	const success = await Commiter.publish({ silentMode: false, arg: process.argv[2] });
	if (!success) process.exit(1);
	console.log(" ");
	console.log("Run this to publish package: ");
	console.log("  yarn publish --non-interactive");
	console.log(" ");
}

main();
