import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import refs from "@cataster/backend/confect/_generated/refs";
import { Skeleton } from "@cataster/ui/components/base/skeleton";

import { LocationHeader } from "~/component/locations/location-header";
import { LocationMapView } from "~/component/locations/location-map";
import { LocationStats } from "~/component/locations/location-stats";
import { TreePanel } from "~/component/trees/tree-panel";
import { confectQuery } from "~/lib/confect";

export const Route = createFileRoute("/app/locations/$id/")({
    component: LocationDetailRoute,
    pendingComponent: LocationDetailPending,
    loader: async ({ context, params }) => {
        await Promise.all([
            context.queryClient.ensureQueryData(
                confectQuery(refs.public.locations.get, { id: params.id }),
            ),
            context.queryClient.ensureQueryData(
                confectQuery(refs.public.trees.listByLocation, {
                    locationId: params.id,
                }),
            ),
        ]);
    },
});

function LocationDetailRoute() {
    const { id } = Route.useParams();

    const { data: location } = useSuspenseQuery(
        confectQuery(refs.public.locations.get, { id }),
    );
    const { data: treeData } = useSuspenseQuery(
        confectQuery(refs.public.trees.listByLocation, { locationId: id }),
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
        <main className="grid grow grid-rows-[auto_auto_1fr] gap-8 px-4 md:grid-cols-3 md:px-8">
            <LocationHeader location={location} />
            <LocationStats trees={treeData.trees} />
            <div className="col-span-full grid grid-cols-subgrid">
                <TreePanel
                    trees={treeData.trees}
                    speciesById={treeData.speciesById}
                />
                <LocationMapView
                    location={location}
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
