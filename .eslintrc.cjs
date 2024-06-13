/** @type {import("eslint").Linter.Config} */
module.exports = {
	root: true,
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
		ecmaFeatures: {
			jsx: true,
		},
	},
	env: {
		browser: true,
		commonjs: true,
		es6: true,
	},
	ignorePatterns: ["!**/.server", "!**/.client", "**/generated/**"],
	extends: ["eslint:recommended"],
	overrides: [
		// Normal Eslint rules
		{
			files: ["**/*.{js,jsx,ts,tsx}"],
			rules: {
				"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
			},
		},
		// React
		{
			files: ["**/*.{js,jsx,ts,tsx}"],
			plugins: [
				"eslint-plugin-react-compiler",
				"react",
				// "jsx-a11y"
			],
			extends: [
				"plugin:react/recommended",
				"plugin:react/jsx-runtime",
				"plugin:react-hooks/recommended",
				// "plugin:jsx-a11y/recommended"
			],
			rules: {
				// "react-compiler/react-compiler": "error",
				"no-mixed-spaces-and-tabs": "off",
				quotes: [2, "double"],
				"react-hooks/rules-of-hooks": "error",
				"react-hooks/exhaustive-deps": "error",
				"react/no-unescaped-entities": "off", // We want to use things like we're and we've,
				// etc. without escaping.
				"import/no-webpack-loader-syntax": "off",
				"@typescript-eslint/no-unused-vars": "off",
				"@typescript-eslint/no-empty-function": "off", // We have a lot of no-op functions
				"react/jsx-uses-vars": "error",
				"react/jsx-uses-react": "error",
			},
			settings: {
				react: {
					version: "detect",
				},
				formComponents: ["Form"],
				linkComponents: [
					{
						name: "Link",
						linkAttribute: "to",
					},
					{
						name: "NavLink",
						linkAttribute: "to",
					},
				],
				"import/resolver": {
					typescript: {},
				},
			},
		},

		// Typescript
		{
			files: ["**/*.{ts,tsx}"],
			plugins: ["@typescript-eslint", "import"],
			parser: "@typescript-eslint/parser",
			settings: {
				"import/internal-regex": "^~/",
				"import/resolver": {
					node: {
						extensions: [".ts", ".tsx"],
					},
					typescript: {
						alwaysTryTypes: true,
					},
				},
			},
			extends: [
				"plugin:@typescript-eslint/recommended",
				"plugin:import/recommended",
				"plugin:import/typescript",
			],
		},

		// Node
		{
			files: [".eslintrc.js"],
			env: {
				node: true,
			},
		},
	],
};
