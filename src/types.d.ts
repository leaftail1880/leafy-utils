interface Package {
	name: string;
	version: string;
	description?: string;
	main?: string;
	author?: string;
	license?: string;
	type?: string;
	files?: string[];
	scripts?: Record<string, string>;
	exports?: Record<string, { default: string; types?: string }>;
}

type CustomEmitter<events extends Record<string | symbol, any>> = {
	on<N extends keyof events>(eventName: N, listener: (arg: events[N]) => void): import("events").EventEmitter;
	emit<N extends keyof events>(eventName: N, arg: events[N]): boolean;
};
