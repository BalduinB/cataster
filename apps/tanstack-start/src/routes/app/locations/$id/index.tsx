import { QueryResult, useQuery } from "@confect/react";
import { createFileRoute } from "@tanstack/react-router";

import refs from "@cataster/backend/confect/_generated/refs";
import { Skeleton } from "@cataster/ui/components/base/skeleton";

import { LocationHeader } from "~/component/locations/location-header";
import { LocationMapView } from "~/component/locations/location-map";
import { LocationStats } from "~/component/locations/location-stats";
import { TreePanel } from "~/component/trees/tree-panel";
import { ErrorComponent } from "~/lib/errors";

export const Route = createFileRoute("/app/locations/$id/")({
    component: LocationDetailRoute,
    pendingComponent: LocationDetailPending,
});

function LocationDetailRoute() {
    const { id } = Route.useParams();

    const location = useQuery(refs.public.locations.get, { id });
    const treeData = useQuery(refs.public.trees.listByLocation, {
        locationId: id,
    });

    if (QueryResult.isLoading(location) || QueryResult.isLoading(treeData)) {
        return <LocationDetailPending />;
    }

    if (QueryResult.isFailure(location)) {
        return <LocationDetailError error={location.error} />;
    }

    if (QueryResult.isFailure(treeData)) {
        return <LocationDetailError error={treeData.error} />;
    }

    return (
        <main className="grid grow grid-rows-[auto_auto_1fr] gap-8 px-4 md:grid-cols-3 md:px-8">
            <LocationHeader location={location.value} />
            <LocationStats trees={treeData.value.trees} />
            <div className="col-span-full grid grid-cols-subgrid">
                <TreePanel
                    trees={treeData.value.trees}
                    speciesById={treeData.value.speciesById}
                />
                <LocationMapView
                    location={location.value}
                    trees={treeData.value.trees}
                    speciesById={treeData.value.speciesById}
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

function LocationDetailError({ error }: { error: unknown }) {
    return (
        <main className="container space-y-4 py-8">
            <ErrorComponent
                error={error}
                fallback="Standort konnte nicht geladen werden."
            />
        </main>
    );
}
