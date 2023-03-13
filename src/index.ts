import { declare } from '@babel/helper-plugin-utils';
import type { PluginPass, Visitor } from '@babel/core';

type ObjectExpression = Visitor<PluginPass>['ObjectExpression'];
type ArrayExpression = Visitor<PluginPass>['ArrayExpression'];

const registerFunctionName = '__object_registery_register__';

export default declare(({ types: t }) => {
	const importFrom = new Set<string>();

	const registerFunctionNameNode = t.identifier(registerFunctionName);

	const registerNode: ObjectExpression = (path, state) => {
		const filename = state.filename!;
		const { node, key, parent } = path;

		(parent as any)[key] = t.callExpression(
			registerFunctionNameNode,
			[
				node,
				t.stringLiteral(filename),
			],
		);

		importFrom.add(filename);
	};

	return {
		name: 'babel-plugin-debug-object-location',
		visitor: {
			ObjectExpression: registerNode as ObjectExpression,
			ArrayExpression: registerNode as ArrayExpression,
			Program: {
				exit(path, { filename }) {
					if (!importFrom.has(filename!)) {
						return;
					}

					path.node.body.unshift(
						t.importDeclaration(
							[t.importDefaultSpecifier(registerFunctionNameNode)],
							t.stringLiteral('babel-plugin-debug-object-location/registry'),
						),
					);
				},
			},
		},
	};
});
