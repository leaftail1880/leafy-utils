import axios from "axios";
import express, { json } from "express";
import os from "os";
import { TypedBind } from "./utils.js";

const default_port = 3000;

export class SyncProccess {
	/**
	 * Makes request to ip with message
	 * @param {{ip: string; data: Record<string, any>; port: number}} options
	 * @returns {Promise<{succesfull: boolean; response: import("axios").AxiosResponse}>}
	 */
	static message({ ip, port, data }) {
		return new Promise((resolve) => {
			axios
				.put(`http://${ip}:${port}/`, data)
				.then((response) => {
					if (response.status !== 200) resolve({ succesfull: false, response });
					else resolve({ succesfull: true, response });
				})
				.catch((response) => resolve({ succesfull: false, response }));
		});
	}
	static get publicIP() {
		const nets = os.networkInterfaces();
		const results = [];

		for (const name in nets) {
			for (const net of nets[name]) {
				// Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
				// 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
				const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;

				if (net.family === familyV4Value && !net.internal) results.push(net.address);
			}
		}
		return results;
	}

	/**
	 * Starts the sync server on specified port
	 * @param {number} port
	 */
	constructor(port = default_port) {
		this.port = port;
		this.server = express();
		this.server.use(json());
	}
	listen() {
		this.server.listen(this.port);
	}
	/**
	 * @param {"put" | "get"} type
	 */
	onMessageType(type) {
		return TypedBind(this.server[type], this.server);
	}
	get syncIP() {
		return SyncProccess.publicIP + ":" + this.port;
	}
}
