import path from 'path';
import fs from 'fs/promises';
import { transform } from '@babel/core';
import { describe, expect } from 'manten';
import babelObjectMark from '#babel-plugin-debug-object-location';
import '#babel-plugin-debug-object-location/registry';

declare let globalThis: Window;

let i = 0;
const createFixture = async (code: string) => {
	const filePath = path.resolve(`.test-${i}.mjs`);
	i += 1;

	await fs.writeFile(filePath, code!.replace(/babel-plugin-debug-object-location/, '#$&'));

	return {
		filePath,
		rm: () => fs.rm(filePath),
	};
};

const filename = '/mark-me.js';
const babelConfig = {
	babelrc: false,
	plugins: [babelObjectMark],
	filename,
};

describe('babel-plugin-debug-object-location', ({ test }) => {
	test('marks object', async () => {
		const object = {
			b: 1,
			c: 2,
		};
		const transformed = transform(`const a = ${JSON.stringify(object)}`, babelConfig);

		const code = transformed?.code;
		if (!code) {
			throw new Error('No code');
		}

		expect(code).toMatch('mark-me.js');
		expect(code).toMatch('__object_registery_register__');
		expect(code).toMatch('babel-plugin-debug-object-location/registry');

		const fixture = await createFixture(code);

		await import(fixture.filePath);

		const matched = globalThis.objectRegistry.find(object);
		expect(Array.isArray(matched)).toBe(true);
		expect(matched[0]).toStrictEqual([object, filename]);

		await fixture.rm();
	});

	test('marks array', async () => {
		const array = [2, 'a', 1];
		const transformed = transform(`const a = ${JSON.stringify(array)};`, babelConfig);

		const code = transformed?.code;
		if (!code) {
			throw new Error('No code');
		}

		expect(code).toMatch('mark-me.js');
		expect(code).toMatch('__object_registery_register__');
		expect(code).toMatch('babel-plugin-debug-object-location/registry');

		const fixture = await createFixture(code);

		await import(fixture.filePath);

		const matched = globalThis.objectRegistry.find(array);
		expect(Array.isArray(matched)).toBe(true);
		expect(matched[0]).toStrictEqual([array, filename]);

		await fixture.rm();
	});

	test('should not import', () => {
		const transformed = transform('const a = 1;', {
			...babelConfig,
			filename: '/dont-mark-me.js',
		});

		expect(transformed?.code).not.toMatch('babel-plugin-debug-object-location/registry');
	});
});
