import {
	type RouteConfig,
	index,
	prefix,
	route,
} from "@react-router/dev/routes";

/**
 * This is the application's routes configuration file.
 *
 * Each route has two required parts:
 * - a URL pattern to match the URL
 * - a file path to the route module that defines its behavior.
 *
 * React Router's routes API provides different options for structuring URLs and
 * nesting route modules, including: `index`, `route`, `layout`, and `...prefix`.
 *
 * Learn more here: https://reactrouter.com/start/framework/routing#configuring-routes
 */
export default [index("./routes/home/home.route.tsx")] satisfies RouteConfig;
