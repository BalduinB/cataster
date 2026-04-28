import { useMapEvents } from "react-leaflet";

interface ClickToPlaceProps {
  onPlace: (lat: number, lng: number) => void;
  enabled?: boolean;
}

/**
 * Headless Leaflet child. Subscribes to `click` on the parent map and reports
 * the LatLng to the parent. Renders nothing.
 */
export function ClickToPlace({ onPlace, enabled = true }: ClickToPlaceProps) {
  useMapEvents({
    click: (e) => {
      if (!enabled) return;
      onPlace(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
