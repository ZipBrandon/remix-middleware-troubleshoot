import type { MetaFunction } from "@remix-run/node";
import type { IndexLoaderServerData } from "~/routes/index/loader.server.ts";
import { useTurboStreamLoaderData } from "~/utils.turbostream.ts";

export { loader } from "./loader.server.ts";
export const meta: MetaFunction = () => {
	return [
		{ title: "New Remix App" },
		{ name: "description", content: "Welcome to Remix!" },
	];
};

export default function Index() {
	const { data, user } = useTurboStreamLoaderData<IndexLoaderServerData>();

	console.log("route", user);

	return (
		<div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
			<h1>{data}</h1>
			<div>{user?.name}</div>
			<div>{user?.email}</div>
		</div>
	);
}
