import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { multiPolygon, point, polygon } from "@turf/helpers";

/**
 * Pure geospatial helpers.
 *
 * These functions deliberately have no Effect dependencies so they can be
 * composed inline by services and called from tests without setting up a
 * runtime. The Effect-shaped wrapper lives in `GeospatialService`.
 */
export type LatLng = { readonly lat: number; readonly lng: number };
export type LocationPolygon = ReadonlyArray<ReadonlyArray<LatLng>>;

function toRingCoordinates(
  ring: ReadonlyArray<LatLng>,
): Array<[number, number]> {
  if (ring.length < 3) return [];

  const coordinates = ring.map((p) => [p.lng, p.lat] as [number, number]);
  const first = coordinates[0]!;
  const last = coordinates[coordinates.length - 1]!;

  if (first[0] !== last[0] || first[1] !== last[1]) {
    coordinates.push(first);
  }

  return coordinates;
}

export function isPointInLocationPolygon(
  treePoint: LatLng,
  locationPolygon: LocationPolygon,
): boolean {
  const validRings = locationPolygon
    .map(toRingCoordinates)
    .filter((ring) => ring.length >= 4);
  if (validRings.length === 0) return false;

  const tree = point([treePoint.lng, treePoint.lat]);
  if (validRings.length === 1) {
    return booleanPointInPolygon(tree, polygon(validRings));
  }

  return booleanPointInPolygon(
    tree,
    multiPolygon(validRings.map((ring) => [ring])),
  );
}
