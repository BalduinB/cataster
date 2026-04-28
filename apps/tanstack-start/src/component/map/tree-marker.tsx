import L from "leaflet";
import { IconPencil } from "@tabler/icons-react";
import { Marker, Popup } from "react-leaflet";

import type { SpeciesDoc, TreeDoc } from "@cataster/backend/types";
import { Button } from "@cataster/ui/components/base/button";

import {
  getSpeciesDisplayName,
  TREE_VITALITY,
} from "~/lib/tree-constants";

// Built-in default icons aren't bundled in a way that survives Vite's asset
// pipeline, so we point Leaflet at the unpkg-hosted assets directly. Keeps
// markers visible without copying static files into `public/`.
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const draftIcon = defaultIcon;

interface TreeMarkerProps {
  tree: TreeDoc;
  species?: SpeciesDoc;
  onEditClick?: (tree: TreeDoc) => void;
}

export function TreeMarker({ tree, species, onEditClick }: TreeMarkerProps) {
  return (
    <Marker position={[tree.latitude, tree.longitude]} icon={defaultIcon}>
      <Popup>
        <div className="min-w-[220px]">
          <p className="flex items-center justify-between gap-2 font-semibold">
            <span className="truncate">
              {species?.deName ?? getSpeciesDisplayName(species)}
            </span>
            {onEditClick && (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => onEditClick(tree)}
              >
                <IconPencil />
              </Button>
            )}
          </p>
          {species && (
            <p className="text-xs text-zinc-500 italic">
              {species.botanicalName}
            </p>
          )}
          <p className="text-sm text-zinc-500">
            {TREE_VITALITY[tree.vitality as keyof typeof TREE_VITALITY]}
          </p>
          {tree.plateNumber && (
            <p className="mt-1 text-xs text-zinc-500">
              Plakette: {tree.plateNumber}
            </p>
          )}
          {tree.notes && (
            <p className="mt-1 text-xs text-zinc-400">{tree.notes}</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
