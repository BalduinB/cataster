import { IconMapPin } from "@tabler/icons-react";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/locations")({
    staticData: {
        breadcrumb: "Standorte",
        nav: {
            title: "Standorte",
            icon: IconMapPin,
            group: "data",
        },
    },
    component: LocationsLayout,
});

function LocationsLayout() {
    return <Outlet />;
}
