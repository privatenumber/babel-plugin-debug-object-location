type UnknownObject = Record<PropertyKey, unknown>;
type FindResults = [UnknownObject, string][];
type Api = {
	registry: Map<UnknownObject, string>;
	find(query: UnknownObject | unknown[]): string | FindResults;
}

const apiName = 'objectRegistry';

declare global {
	interface Window {
		[apiName]: Api;
	}
}

declare let globalThis: Window;

const initialize = (context: Window) => {
	const api: Api = {
		registry: new Map(),
		find(query) {
			const { registry } = this;

			// Identity mode
			for (const [object, filePath] of registry) {
				if (object === query) {
					return filePath;
				}
			}

			// Query mode - check if the query is a subset of the target
			const matches: FindResults = [];

			if (Array.isArray(query)) {
				for (const [array, filePath] of registry) {
					if (Array.isArray(array)) {
						const elementsMatch = query.every(value => array.includes(value));
						if (elementsMatch) {
							matches.push([array, filePath]);
						}
					}
				}
			} else {
				const findObjectKeys = Object.keys(query);
				for (const [object, filePath] of registry) {
					const keysMatch = findObjectKeys.every(key => object[key] === query[key]);
					if (keysMatch) {
						matches.push([object, filePath]);
					}
				}
			}

			return matches;
		},
	};

	context[apiName] = api;
	return api;
};

const register = (
	object: Record<PropertyKey, unknown>,
	filePath: string,
) => {
	// Get top-most window (in case of iframes)
	let topGlobal = globalThis;
	while (
		topGlobal.parent
		&& topGlobal.parent !== topGlobal
	) {
		topGlobal = topGlobal.parent;
	}

	let api = topGlobal[apiName];
	if (!api) {
		api = initialize(topGlobal);
	}

	api.registry.set(object, filePath);

	return object;
};

export default register;
