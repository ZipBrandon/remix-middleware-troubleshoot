import type { LoaderFunctionArgs } from "@remix-run/node";
import { AuthenticatedUserContext } from "~/middleware/authenticatedUserMiddleware.ts";

type LoaderType = typeof loader;
export type IndexLoaderServerData = LoaderType;

export const loader = async (args: LoaderFunctionArgs) => {
	const user = args.context.get(AuthenticatedUserContext);

	console.log("loader", user);

	return {
		data: "Hello there!",
		user: user,
	};
};
