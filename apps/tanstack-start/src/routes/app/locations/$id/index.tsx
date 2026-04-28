import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import type { LocationId } from "@cataster/backend/types";
import refs from "@cataster/backend/confect/_generated/refs";
import { Skeleton } from "@cataster/ui/components/base/skeleton";

import { LocationHeader } from "~/component/locations/location-header";
import { LocationMapView } from "~/component/locations/location-map";
import { TreePanel } from "~/component/trees/tree-panel";
import { confectQuery } from "~/lib/confect";

export const Route = createFileRoute("/app/locations/$id/")({
    component: LocationDetailRoute,
    pendingComponent: LocationDetailPending,
    loader: async ({ context, params }) => {
        const id = params.id as LocationId;
        await Promise.all([
            context.queryClient.ensureQueryData(
                confectQuery(refs.public.locations.get, { id }),
            ),
            context.queryClient.ensureQueryData(
                confectQuery(refs.public.trees.listByLocation, {
                    locationId: id,
                }),
            ),
        ]);
    },
});

function LocationDetailRoute() {
    const { id } = Route.useParams();
    const locationId = id as LocationId;

    const { data: location } = useSuspenseQuery(
        confectQuery(refs.public.locations.get, { id: locationId }),
    );
    const { data: treeData } = useSuspenseQuery(
        confectQuery(refs.public.trees.listByLocation, { locationId }),
    );

    if (!location) {
        return (
            <main className="container py-8">
                <p className="text-muted-foreground">
                    Standort nicht gefunden.
                </p>
            </main>
        );
    }

    return (
        <main className="container space-y-4 py-8">
            <LocationHeader location={location} />
            <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
                <LocationMapView
                    location={location}
                    trees={treeData.trees}
                    speciesById={treeData.speciesById}
                />
                <TreePanel
                    trees={treeData.trees}
                    speciesById={treeData.speciesById}
                />
            </div>
        </main>
    );
}

function LocationDetailPending() {
    return (
        <main className="container space-y-4 py-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-[500px] w-full" />
        </main>
    );
}
