import { IconLayoutDashboard } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
    staticData: {
        nav: {
            title: "Dashboard",
            icon: IconLayoutDashboard,
        },
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/app/"!</div>;
}
