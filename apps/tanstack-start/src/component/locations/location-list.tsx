import { IconMapPin } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import type { LocationDoc } from "@cataster/backend/types";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@cataster/ui/components/base/card";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@cataster/ui/components/base/empty";

interface LocationListProps {
    locations: ReadonlyArray<LocationDoc>;
}

export function LocationList({ locations }: LocationListProps) {
    if (locations.length === 0) {
        return (
            <Empty>
                <EmptyMedia variant="icon">
                    <IconMapPin />
                </EmptyMedia>
                <EmptyHeader>
                    <EmptyTitle>Keine Standorte vorhanden</EmptyTitle>
                    <EmptyDescription>
                        Erstelle einen neuen Standort, um Bäume auf der Karte zu
                        verwalten.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
                <Link
                    key={location._id}
                    to="/app/locations/$id"
                    params={{ id: location._id }}
                >
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <IconMapPin className="text-primary size-4" />
                                {location.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                OSM {location.osmType} #{location.osmId}
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
