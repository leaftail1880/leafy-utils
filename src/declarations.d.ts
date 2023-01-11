export interface Package {
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

export type CustomEmitter<events extends Record<string | symbol, any>, names = keyof events> = {
	on<N extends names>(eventName: N, listener: (arg: events[N]) => void): CustomEmitter<events>;
	off<N extends names>(eventName: N, listener: (arg: events[N]) => void): CustomEmitter<events>;
	once<N extends names>(eventName: N, listener: (arg: events[N]) => void): CustomEmitter<events>;
	emit<N extends names>(eventName: N, arg: events[N]): boolean;
};
