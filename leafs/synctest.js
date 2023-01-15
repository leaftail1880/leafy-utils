// @ts-check

import { SyncProccess } from "../src/sync.js";

async function main() {
	const port = 3012;
	const sync = new SyncProccess(port);
	sync.onMessageType("get")("/", (req, res) => {
		res.status(200).json({ status: 200 });
	});
	sync.onMessageType("put")("/", (req, res) => {
		console.log("Sync request:", req.body);
		res.sendStatus(200);
	});

	sync.listen();
	console.log("Server listening on ip", sync.syncIP);

	setTimeout(async () => {
		const data = { e: 1, ad: "asd" };

		console.log(await SyncProccess.message({ ip: SyncProccess.publicIP[0], port, data }));
	}, 2000);
}

main();
