import { Polygon } from "react-leaflet";

interface LocationPolygonProps {
    polygon: ReadonlyArray<ReadonlyArray<{ lat: number; lng: number }>>;
}

/**
 * Renders the (possibly multi-ring) location boundary as a green polygon
 * overlay on the parent map.
 */
export function LocationPolygon({ polygon }: LocationPolygonProps) {
    return (
        <>
            {polygon.map((ring, i) => (
                <Polygon
                    key={i}
                    positions={ring.map(
                        (p) => [p.lat, p.lng] as [number, number],
                    )}
                    pathOptions={{
                        color: "#16a34a",
                        fillColor: "#16a34a",
                        fillOpacity: 0.15,
                        weight: 2,
                    }}
                />
            ))}
        </>
    );
}
