import { useState } from "react";

import type {
    LocationDoc,
    SpeciesDoc,
    SpeciesId,
    TreeDoc,
} from "@cataster/backend/types";
import { Card } from "@cataster/ui/components/base/card";

import { LocationPolygon } from "~/component/map/location-polygon";
import { MapView } from "~/component/map/map-view";
import { TreeMarker } from "~/component/map/tree-marker";
import { TreeFormDialog } from "~/component/trees/tree-form-dialog";

interface LocationMapViewProps {
    location: LocationDoc;
    trees: ReadonlyArray<TreeDoc>;
    speciesById: Readonly<Record<SpeciesId, SpeciesDoc>>;
}

export function LocationMapView({
    location,
    trees,
    speciesById,
}: LocationMapViewProps) {
    const [selectedTree, setSelectedTree] = useState<TreeDoc | null>(null);

    return (
        <>
            <Card className="overflow-hidden p-0">
                <MapView
                    center={[location.centroid.lat, location.centroid.lng]}
                    zoom={16}
                    className="h-[500px] w-full"
                >
                    <LocationPolygon polygon={location.polygon} />
                    {trees.map((tree) => (
                        <TreeMarker
                            key={tree._id}
                            tree={tree}
                            species={speciesById[tree.speciesId]}
                            onEditClick={(t) => setSelectedTree(t)}
                        />
                    ))}
                </MapView>
            </Card>

            <TreeFormDialog
                open={!!selectedTree}
                onOpenChange={(open) => !open && setSelectedTree(null)}
                locationId={location._id}
                tree={selectedTree}
            />
        </>
    );
}
