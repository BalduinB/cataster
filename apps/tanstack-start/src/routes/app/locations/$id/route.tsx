import type { AnyRouteMatch } from "@tanstack/react-router";
import { IconMapPinSearch } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import type { LocationId } from "@cataster/backend/types";
import refs from "@cataster/backend/confect/_generated/refs";

import { LocationPicker } from "~/component/locations/picker";
import { confectQuery } from "~/lib/confect";
import { PARAM_PLACEHOLDER } from "~/router";

export const Route = createFileRoute("/app/locations/$id")({
    staticData: {
        breadcrumb: LocationBreadcrumb,
    },
    component: LocationsLayout,
});

function LocationsLayout() {
    const { id } = Route.useParams();
    if (id === PARAM_PLACEHOLDER) {
        return <LocationPicker />;
    }
    return <Outlet />;
}

function LocationBreadcrumb({ match }: { match: AnyRouteMatch }) {
    const id = (match.params as { id: string }).id as LocationId;
    // Non-suspense read against the same query key the loader pre-populates,
    // so we never block the layout while the location detail is loading.
    const { data: location } = useQuery({
        ...confectQuery(refs.public.locations.get, { id }),
        enabled: id !== PARAM_PLACEHOLDER,
    });
    if (id === PARAM_PLACEHOLDER) {
        return <IconMapPinSearch className="size-4" />;
    }
    return location?.name ?? "Standort";
}
