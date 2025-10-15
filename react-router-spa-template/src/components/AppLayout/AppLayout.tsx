import type { PropsWithChildren } from "react";

import { AppHeader } from "~/components/AppHeader";

export function AppLayout({ children }: PropsWithChildren) {
	return (
		<div className="flex flex-col w-full h-full overflow-hidden">
			<AppHeader />
			Layout
		</div>
	);
}
