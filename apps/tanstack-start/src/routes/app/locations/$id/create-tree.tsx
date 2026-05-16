import { useState } from "react";
import { IconCrosshair, IconEye, IconTree } from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Marker } from "react-leaflet";
import { toast } from "sonner";

import refs from "@cataster/backend/confect/_generated/refs";
import { Button } from "@cataster/ui/components/base/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@cataster/ui/components/base/popover";
import { Skeleton } from "@cataster/ui/components/base/skeleton";

import { ClickToPlace } from "~/component/map/click-to-place";
import { LocationPolygon } from "~/component/map/location-polygon";
import { MapView } from "~/component/map/map-view";
import { draftIcon, TreeMarker } from "~/component/map/tree-marker";
import { TreeCreateForm } from "~/component/trees/tree-form";
import { confectQuery } from "~/lib/confect";

export const Route = createFileRoute("/app/locations/$id/create-tree")({
    staticData: {
        breadcrumb: "Baum anlegen",
        nav: {
            title: "Baum anlegen",
            icon: IconTree,
            parent: "/app/locations",
        },
    },
    component: CreateTreeRoute,
    pendingComponent: CreateTreePending,

    loader: async ({ context, params: { id } }) => {
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

    const locationId = id;
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
        if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
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

            <AnimatePresence mode="wait" initial={false}>
                {position ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="space-y-4"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                                <p className="text-muted-foreground text-xs">
                                    Gewählte Position: {position.lat.toFixed(5)}
                                    , {position.lng.toFixed(5)}
                                </p>
                                <Popover>
                                    <PopoverTrigger
                                        render={
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Position auf der Karte anzeigen"
                                                className="size-7"
                                            />
                                        }
                                    >
                                        <IconEye className="size-4" />
                                    </PopoverTrigger>
                                    <PopoverContent
                                        align="start"
                                        className="w-80 p-0"
                                    >
                                        <div className="overflow-hidden rounded-2xl border">
                                            <MapView
                                                center={[
                                                    position.lat,
                                                    position.lng,
                                                ]}
                                                zoom={17}
                                                className="h-56 w-full"
                                            >
                                                <LocationPolygon
                                                    polygon={location.polygon}
                                                />

                                                <Marker
                                                    position={[
                                                        position.lat,
                                                        position.lng,
                                                    ]}
                                                    icon={draftIcon}
                                                />
                                            </MapView>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPosition(null)}
                            >
                                Position ändern
                            </Button>
                        </div>
                        <TreeCreateForm
                            locationId={locationId}
                            treePosition={position}
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
                                        <form.SubmitButton
                                            isLoading={isPending}
                                        >
                                            Erstellen
                                        </form.SubmitButton>
                                    </form.AppForm>
                                </div>
                            )}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="map"
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="space-y-2"
                    >
                        <p className="text-sm font-medium">
                            Position auf der Karte
                        </p>
                        <p className="text-muted-foreground text-xs">
                            Klicke auf die Karte, um den Baum zu platzieren oder
                            nutze den GPS Button um den aktuellen Standort zu
                            verwenden.
                        </p>
                        <div className="relative overflow-hidden rounded-lg border">
                            <MapView
                                center={[
                                    location.centroid.lat,
                                    location.centroid.lng,
                                ]}
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
                                <ClickToPlace
                                    onPlace={(lat, lng) =>
                                        setPosition({ lat, lng })
                                    }
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
                    </motion.div>
                )}
            </AnimatePresence>
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
