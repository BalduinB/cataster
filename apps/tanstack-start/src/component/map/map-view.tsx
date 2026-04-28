import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer } from "react-leaflet";

import { cn } from "@cataster/ui/lib/utils";

interface MapViewProps {
    center: [number, number];
    zoom?: number;
    maxZoom?: number;
    className?: string;
    children?: ReactNode;
}

/**
 * Leaflet map wrapper.
 *
 * Leaflet touches `window` synchronously, so server rendering is impossible —
 * we gate the entire `MapContainer` behind a mount check and render a
 * placeholder of the same dimensions during SSR/first paint. The placeholder
 * keeps the layout stable; the real map fades in once mounted.
 */
export function MapView({
    center,
    zoom = 15,
    maxZoom = 21,
    className,
    children,
}: MapViewProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <div
                className={cn(
                    "bg-muted/40 relative z-0 h-[500px] w-full animate-pulse",
                    className,
                )}
            />
        );
    }

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            maxZoom={maxZoom}
            className={cn("relative z-0 h-[500px] w-full", className)}
            scrollWheelZoom
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxNativeZoom={19}
                maxZoom={maxZoom}
            />
            {children}
        </MapContainer>
    );
}
