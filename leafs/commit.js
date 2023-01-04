import { commiter } from "../src/commit.js";

commiter.on("after_commit", () => {
	console.log(" ");
	console.log(" Run this to publish package: ");
	console.log("yarn publish --non-interactive");
});

commiter.emit("commit", { silentMode: false });
