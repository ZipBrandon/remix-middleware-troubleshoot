import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";

export function useTurboStreamLoaderData<T extends LoaderFunction>() {
	return useLoaderData() as unknown as Awaited<ReturnType<T>>;
}

export function useTurboStreamActionData<T extends ActionFunction>() {
	return useActionData() as unknown as Awaited<ReturnType<T>> | undefined;
}
