import { useState } from "react";
import { IconCrosshair } from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Marker } from "react-leaflet";
import { toast } from "sonner";

import type { LocationId } from "@cataster/backend/types";
import refs from "@cataster/backend/confect/_generated/refs";
import { Button } from "@cataster/ui/components/base/button";
import { Skeleton } from "@cataster/ui/components/base/skeleton";

import { ClickToPlace } from "~/component/map/click-to-place";
import { LocationPolygon } from "~/component/map/location-polygon";
import { MapView } from "~/component/map/map-view";
import { draftIcon, TreeMarker } from "~/component/map/tree-marker";
import { TreeForm } from "~/component/trees/tree-form";
import { confectQuery } from "~/lib/confect";

export const Route = createFileRoute("/app/locations/$id/create-tree")({
    component: CreateTreeRoute,
    pendingComponent: CreateTreePending,
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

function CreateTreeRoute() {
    const { id } = Route.useParams();
    const locationId = id as LocationId;
    const navigate = useNavigate();

    const { data: location } = useSuspenseQuery(
        confectQuery(refs.public.locations.get, { id: locationId }),
    );
    const { data: treeData } = useSuspenseQuery(
        confectQuery(refs.public.trees.listByLocation, { locationId }),
    );

    const [position, setPosition] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);

    const goBack = () =>
        void navigate({ to: "/app/locations/$id", params: { id: locationId } });

    const requestCurrentPosition = () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            toast.error(
                "Geolocation wird in diesem Browser nicht unterstützt.",
            );
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsLoading(false);
                setPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                toast.success(
                    "Position übernommen – bei Bedarf per Klick auf der Karte anpassen.",
                );
            },
            () => {
                setGpsLoading(false);
                toast.error(
                    "Standort konnte nicht ermittelt werden. Bitte Berechtigung prüfen oder manuell klicken.",
                );
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
        );
    };

    if (!location) {
        return (
            <main className="container py-8">
                <p className="text-muted-foreground">
                    Standort nicht gefunden.
                </p>
            </main>
        );
    }

    const { trees, speciesById } = treeData;

    return (
        <main className="container space-y-4 py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {location.name}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Neuen Baum anlegen
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium">Position auf der Karte</p>
                <p className="text-muted-foreground text-xs">
                    Klicke auf die Karte, um den Baum zu platzieren oder nutze
                    den GPS Button um den aktuellen Standort zu verwenden.
                </p>
                <div className="relative overflow-hidden rounded-lg border">
                    <MapView
                        center={[location.centroid.lat, location.centroid.lng]}
                        zoom={16}
                        className="h-[420px] w-full"
                    >
                        <LocationPolygon polygon={location.polygon} />
                        {trees.map((tree) => (
                            <TreeMarker
                                key={tree._id}
                                tree={tree}
                                species={speciesById[tree.speciesId]}
                            />
                        ))}
                        {position ? (
                            <Marker
                                position={[position.lat, position.lng]}
                                icon={draftIcon}
                            />
                        ) : null}
                        <ClickToPlace
                            onPlace={(lat, lng) => setPosition({ lat, lng })}
                        />
                    </MapView>
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={requestCurrentPosition}
                        isLoading={gpsLoading}
                        aria-label="Aktuellen Standort verwenden"
                        className="absolute top-2 right-2 rounded-lg"
                    >
                        <IconCrosshair />
                    </Button>
                </div>
            </div>

            {position ? (
                <>
                    <p className="text-muted-foreground text-xs">
                        Gewählte Position: {position.lat.toFixed(5)},{" "}
                        {position.lng.toFixed(5)}
                    </p>
                    <TreeForm
                        // Re-mount the form when the position changes so default values
                        // (and any in-flight zod validation state) reset; the user is
                        // effectively starting a new draft.
                        key={`${position.lat}-${position.lng}`}
                        mode="create"
                        locationId={locationId}
                        treePosition={position}
                        tree={null}
                        onSuccess={goBack}
                        renderFooter={({ form, isPending }) => (
                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    render={
                                        <Link
                                            to="/app/locations/$id"
                                            params={{ id: locationId }}
                                        />
                                    }
                                >
                                    Abbrechen
                                </Button>
                                <form.AppForm>
                                    <form.SubmitButton isLoading={isPending}>
                                        Erstellen
                                    </form.SubmitButton>
                                </form.AppForm>
                            </div>
                        )}
                    />
                </>
            ) : (
                <p className="text-muted-foreground text-sm">
                    Bitte zuerst eine Position auf der Karte wählen.
                </p>
            )}
        </main>
    );
}

function CreateTreePending() {
    return (
        <main className="container space-y-4 py-8">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-[420px] w-full" />
        </main>
    );
}
