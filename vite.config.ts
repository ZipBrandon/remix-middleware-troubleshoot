import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { expressDevServer } from "remix-express-dev-server";
import { defineConfig } from "vite";
import { envOnlyMacros } from "vite-env-only";
import babel from "vite-plugin-babel";
import tsconfigPaths from "vite-tsconfig-paths";
import { flatRoutes } from "./remix-flat-routes/esm/index.js";
const ReactCompilerConfig = {};
installGlobals({ nativeFetch: true });
export default defineConfig({
	optimizeDeps: {
		include: ["react", "react-dom"],
	},
	plugins: [
		remix({
			future: {
				unstable_singleFetch: true,
				v3_fetcherPersist: true,
				v3_relativeSplatPath: true,
				v3_throwAbortReason: true,
			},
			routes: async (defineRoutes) => {
				return flatRoutes("routes", defineRoutes, {
					nestedFolderChar: "-",
					routeRegex: (options) => {
						const { nestedFolderChar } = options;
						return new RegExp(
							`(([${nestedFolderChar}][\\/\\\\][^\\/\\\\:?*]+)|[\\/\\\\]((index|route|layout|page)|(_[^\\/\\\\:?*]+)|([^\\/\\\\:?*]+\\.route)))\\.(ts|tsx|js|jsx|md|mdx)$(?<!schema\\.tsx?|fetcher\\.tsx?|stores\\.tsx?|columns\\.tsx?|utils\\.tsx?|routeLoaders.tsx?)`,
						);
					},
				});
			},
		}),
		babel({
			filter: /\.[jt]sx?$/,
			exclude: [/.*generated\/graphql.*/, /node_modules/],
			babelConfig: {
				presets: ["@babel/preset-typescript"], // if you use TypeScript
				plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
			},
		}),
		tsconfigPaths(),
		expressDevServer(),
		envOnlyMacros(),
	],
});
