import { useState } from "react";
import { IconMapPin, IconPlus, IconSearch } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import refs from "@cataster/backend/confect/_generated/refs";
import { Button } from "@cataster/ui/components/base/button";
import { Card, CardContent } from "@cataster/ui/components/base/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@cataster/ui/components/base/dialog";
import { Input } from "@cataster/ui/components/base/input";
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from "@cataster/ui/components/base/item";
import { Label } from "@cataster/ui/components/base/label";
import { Skeleton } from "@cataster/ui/components/base/skeleton";

import { useConfectActionFn, useConfectMutationFn } from "~/lib/confect";
import { toastConfectError } from "~/lib/error-toast";

type OsmResult = {
    osmId: number;
    osmType: string;
    displayName: string;
    lat: number;
    lng: number;
    type: string;
};

/**
 * Lets the user search OpenStreetMap for an area, pick a result, and turn it
 * into a `locations` row. Behind the scenes that's two backend calls: an OSM
 * action (`searchAreas` / `fetchBoundary`) followed by the `locations.create`
 * mutation. Errors from either step surface through `toastConfectError`.
 */
export function CreateLocationDialog() {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedResult, setSelectedResult] = useState<OsmResult | null>(
        null,
    );
    const [name, setName] = useState("");

    const searchAreas = useConfectActionFn(refs.public.osm.searchAreas);
    const fetchBoundary = useConfectActionFn(refs.public.osm.fetchBoundary);
    const createLocation = useConfectMutationFn(refs.public.locations.create);

    const search = useMutation({
        mutationFn: (query: string) => searchAreas({ query }),
        onSuccess: (areas) => {
            setSelectedResult(null);
        },
        onError: (error) => {
            toastConfectError("Fehler bei der Suche", error);
        },
    });

    const create = useMutation({
        mutationFn: async (input: { result: OsmResult; name: string }) => {
            const boundary = await fetchBoundary({
                osmId: input.result.osmId,
                osmType: input.result.osmType,
            });
            return createLocation({
                name: input.name,
                osmId: input.result.osmId,
                osmType: input.result.osmType,
                polygon: boundary.polygon,
                centroid: boundary.centroid,
            });
        },
        onSuccess: () => {
            toast.success("Standort erstellt");
            setOpen(false);
            setSearchQuery("");
            setSelectedResult(null);
            setName("");
        },
        onError: (error) => {
            toastConfectError("Fehler beim Erstellen", error);
        },
    });

    const handleSelect = (result: OsmResult) => {
        setSelectedResult(result);
        const shortName =
            result.displayName.split(",")[0]?.trim() ?? result.displayName;
        setName(shortName);
    };

    const handleCreate = () => {
        if (!selectedResult || !name.trim()) return;
        create.mutate({ result: selectedResult, name: name.trim() });
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        search.mutate(searchQuery);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
                <IconPlus />
                Standort
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Neuen Standort erstellen</DialogTitle>
                    <DialogDescription>
                        Suche nach einem Gebiet auf OpenStreetMap, um einen
                        Standort zu erstellen.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2">
                    <Input
                        placeholder="z.B. Rheinaue Bonn, Hofgarten..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button
                        onClick={handleSearch}
                        disabled={search.isPending}
                        isLoading={search.isPending}
                    >
                        <IconSearch />
                        Suchen
                    </Button>
                </div>

                {search.isPending && (
                    <div className="space-y-2">
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                    </div>
                )}
                {search.isError && (
                    <div className="space-y-2">
                        <p className="text-red-500">Fehler beim Suchen</p>
                    </div>
                )}

                {search.isSuccess && (
                    <div className="max-h-[300px] space-y-2 overflow-y-auto p-2">
                        {search.data?.map((result) => (
                            <Item
                                key={`${result.osmType}-${result.osmId}`}
                                className={
                                    selectedResult?.osmId === result.osmId
                                        ? "border-primary bg-primary/5 cursor-pointer transition-colors"
                                        : "hover:border-primary/50 cursor-pointer transition-colors"
                                }
                                variant={"outline"}
                                onClick={() => handleSelect(result)}
                            >
                                <ItemMedia variant={"icon"}>
                                    <IconMapPin className="text-primary size-4 shrink-0" />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>
                                        {result.displayName.split(",")[0]}
                                    </ItemTitle>
                                    <ItemDescription className="text-muted-foreground truncate text-xs">
                                        {result.displayName}
                                    </ItemDescription>
                                </ItemContent>
                            </Item>
                        ))}
                    </div>
                )}

                {selectedResult && (
                    <div className="space-y-3 border-t pt-3">
                        <div className="space-y-2">
                            <Label htmlFor="location-name">Name</Label>
                            <Input
                                id="location-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Name für den Standort"
                            />
                        </div>
                        <Button
                            onClick={handleCreate}
                            disabled={!name.trim()}
                            isLoading={create.isPending}
                            className="w-full"
                        >
                            Standort erstellen
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
