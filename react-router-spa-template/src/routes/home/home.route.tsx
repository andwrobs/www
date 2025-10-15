import type { Route } from "./+types/home.route";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
	return {};
}

export default function HomeRoute() {
	return <div>Home</div>;
}
