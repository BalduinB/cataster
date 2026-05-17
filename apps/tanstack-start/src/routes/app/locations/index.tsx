import { QueryResult, useQuery } from "@confect/react";
import { createFileRoute } from "@tanstack/react-router";

import refs from "@cataster/backend/confect/_generated/refs";
import { Skeleton } from "@cataster/ui/components/base/skeleton";

import { CreateLocationDialog } from "~/component/locations/create-location-dialog";
import { LocationList } from "~/component/locations/location-list";

export const Route = createFileRoute("/app/locations/")({
    component: LocationsRouteComponent,
    pendingComponent: LocationsPending,
});

function LocationsRouteComponent() {
    const locations = useQuery(refs.public.locations.list, {});

    return QueryResult.match(locations, {
        onLoading: () => <LocationsPending />,
        onFailure: () => (
            <main className="container space-y-6 py-8">
                <p className="text-destructive">
                    Standorte konnten nicht geladen werden.
                </p>
            </main>
        ),
        onSuccess: (locations) => (
            <main className="container space-y-6 py-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Standorte
                    </h1>
                    <CreateLocationDialog />
                </div>
                <LocationList locations={locations} />
            </main>
        ),
    });
}

function LocationsPending() {
    return (
        <main className="container space-y-6 py-8">
            <Skeleton className="h-10 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        </main>
    );
}
