import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";

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
import { TreeEditFormDialog } from "~/component/trees/tree-form-dialog";
import { useSelectedTree } from "~/store/selected-tree";

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
                    <SelectedTreeFocus trees={trees} />
                </MapView>
            </Card>
            {selectedTree && (
                <TreeEditFormDialog
                    open={!!selectedTree}
                    onOpenChange={(open) => !open && setSelectedTree(null)}
                    tree={selectedTree}
                />
            )}
        </>
    );
}

function SelectedTreeFocus({ trees }: { trees: ReadonlyArray<TreeDoc> }) {
    const map = useMap();
    const selectedTreeId = useSelectedTree((s) => s.selectedTreeId);

    useEffect(() => {
        if (!selectedTreeId) return;
        const tree = trees.find((t) => t._id === selectedTreeId);
        if (!tree) return;
        map.flyTo([tree.latitude, tree.longitude], Math.max(map.getZoom(), 18), {
            duration: 0.6,
        });
    }, [selectedTreeId, trees, map]);

    return null;
}
