import fs from "fs/promises";
import path from "path";
import { PackageJSON } from "./src/package.js";

function toUserPath($path) {
	return path.join("../../", $path);
}

async function main() {
	console.log(" ");
	const scripts = (await fs.readdir("src")).filter((e) => e.endsWith(".js"));

	await fs.writeFile(
		"exports.js",
		`// This file is generated by install.js\n\n${scripts.map((e) => `export * from "./src/${e}"`).join("\n")}`
	);

	if (path.normalize(process.argv[1]).split(path.sep).reverse()[2] !== "node_modules")
		return console.log("No user scripts called.\n ");

	await addScriptsToPackage();

	await addSamples();

	console.log(" ");
	process.exit(0);
}

async function addScriptsToPackage() {
	const leafs = toUserPath("leafs");

	try {
		await fs.access(leafs);
	} catch (e) {
		return 0;
	}

	const user_scripts = await fs.readdir(leafs);
	console.log("Scripts to save:", user_scripts);

	const user_package = new PackageJSON(toUserPath("package.json"));
	await user_package.read();
	const data = user_package.data;

	// Clear all generated scripts
	for (const script in data.scripts) {
		if (data.scripts[script].includes("leafs")) delete data.scripts[script];
	}

	for (let uscript of user_scripts) {
		const name = uscript.replace(/\.js$/, "");
		if (name in data.scripts) {
			// Script was already declarated
			console.error("Found script duplicate: ", name);
			console.error(`Rename leafs/${uscript} to disable this warning`);
			continue;
		}

		data.scripts[name] = `node leafs/${uscript}`;
	}

	data.scripts.update_leafs = "cd node_modules/leafy-utils && node install.js";

	await user_package.write();
}

async function addSamples() {
	const sample_path = "leafs";

	try {
		await fs.access(toUserPath(sample_path));
	} catch (e) {
		return 0;
	}

	const sample_suffix = ".sample";
  const sample_regexp = new RegExp(sample_suffix+"$")
	const leaf_samples = (await fs.readdir(sample_path))
		.filter((e) => e.endsWith(sample_suffix))
		.map((e) => e.replace(sample_regexp, ''));


	const added_samples = [];

	for (const sample_name of leaf_samples) {
		const path_to_leaf = path.join(sample_path, sample_name);
		const path_to_user_leaf = toUserPath(path_to_leaf);

		let orig_file;
		try {
			orig_file = await fs.readFile(path_to_user_leaf);
		} catch (e) {
			if ("ENOENT" !== e.code) throw e
		}

		// File already exists, we dont need to make sample for it.
		if (orig_file) continue;

		await fs.writeFile(path_to_user_leaf, await fs.readFile(path_to_leaf + sample_suffix));
	}

	console.log("Succesfully added samples: ", added_samples);
}

main();
