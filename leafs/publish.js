import fs from "fs/promises";
import { commiter } from "../src/commit.js";

commiter.on("after_commit", async ({ version, suffix, type, prev_version }) => {
	console.log(prev_version.join("."), "->", version.join("."));
	let password;
	try {
		password = await fs.readFile("npm-password");
	} catch {
		console.warn("No npm-password file found!");
		process.exit(1);
	}
	console.log(password);
});

commiter.emit("commit", null);
