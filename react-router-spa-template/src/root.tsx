import type React from "react";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
} from "react-router";

import { AppLayout } from "~/components/AppLayout";
import type { Route } from "./+types/root";

import "@fontsource/inter";

import "~/styles/index.css";

/**
 * root.tsx's `clientLoader` runs:
 * - once when the app is mounted
 * - whenever a form is submitted
 */
export async function clientLoader({ request }: Route.ClientLoaderArgs) {}

/**
 * Special file `root.tsx` root route supports a `Layout` export, routes defined in `routes.ts` do not.
 *
 * The `Layout` component serves 2 purposes:
 * - Avoid duplicating your document's "app shell" across your root component, `HydrateFallback`, and `ErrorBoundary`
 * - Prevent React from re-mounting your app shell elements when switching between the root component/HydrateFallback/ErrorBoundary
 * which can cause a FOUC if React removes and re-adds `<link>` tags from your `<Links>` component.
 *
 * https://reactrouter.com/explanation/special-files#layout-export
 */
export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

/**
 * All routes configured in routes.ts are rendered through the `<Outlet/>` in this component.
 * https://reactrouter.com/start/framework/route-module#component-default
 */
export default function RootRoute() {
	return (
		<AppLayout>
			<Outlet />
		</AppLayout>
	);
}

/**
 * Route modules will automatically catch errors in your code and render the closest ErrorBoundary.
 *
 * All application's should at a minimum export a root error boundary to protect against unhandled exceptions in:
 * - clientLoader
 * - clientAction
 * - component code
 *
 * https://reactrouter.com/how-to/error-boundary#error-boundaries
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Error";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	console.error(error);

	return (
		<main>
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre>
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
