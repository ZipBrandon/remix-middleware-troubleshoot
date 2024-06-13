import { createContext } from "remix-create-express-app/context";
import type { MiddlewareFunctionArgs } from "remix-create-express-app/middleware";

export type AuthenticatedUser = {
	name: string;
	email: string;
};

export const AuthenticatedUserContext = createContext<AuthenticatedUser>();

export async function authenticatedUserMiddleware({
	request,
	context,
	params,
	next,
}: MiddlewareFunctionArgs) {
	const authenticatedUser = {
		name: "Bob Smith",
		email: "bobsmith@sadkfjadlsfasdlf.com",
	};

	console.log("authenticatedUserMiddleware", authenticatedUser);

	context.set(AuthenticatedUserContext, authenticatedUser);

	return await next();
}
