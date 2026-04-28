import { useState } from "react";
import { IconPencil, IconTrash, IconTrees } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SpeciesDoc, SpeciesId, TreeDoc } from "@cataster/backend/types";
import refs from "@cataster/backend/confect/_generated/refs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@cataster/ui/components/base/alert-dialog";
import { Badge } from "@cataster/ui/components/base/badge";
import { Button } from "@cataster/ui/components/base/button";
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
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@cataster/ui/components/base/item";
import { ScrollArea } from "@cataster/ui/components/base/scroll-area";

import { useConfectMutationFn } from "~/lib/confect";
import { toastConfectError } from "~/lib/error-toast";
import {
    getSpeciesDisplayName,
    TREE_VITALITY,
    TREE_VITALITY_COLORS,
} from "~/lib/tree-constants";
import { TreeFormDialog } from "./tree-form-dialog";

interface TreePanelProps {
    trees: ReadonlyArray<TreeDoc>;
    speciesById: Readonly<Record<SpeciesId, SpeciesDoc>>;
}

export function TreePanel({ trees, speciesById }: TreePanelProps) {
    return (
        <Card className="h-fit" size="sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconTrees className="size-5" />
                    Bäume ({trees.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="max-h-[400px]">
                    {trees.length === 0 ? (
                        <Empty className="py-6">
                            <EmptyMedia variant="icon">
                                <IconTrees />
                            </EmptyMedia>
                            <EmptyHeader>
                                <EmptyTitle className="text-sm">
                                    Keine Bäume
                                </EmptyTitle>
                                <EmptyDescription className="text-xs">
                                    Lege den ersten Baum über &quot;Neuer
                                    Baum&quot; an.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <div className="space-y-2 p-1">
                            {trees.map((tree) => (
                                <TreeItem
                                    key={tree._id}
                                    tree={tree}
                                    species={speciesById[tree.speciesId]}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

function TreeItem({ tree, species }: { tree: TreeDoc; species?: SpeciesDoc }) {
    const [editOpen, setEditOpen] = useState(false);
    const removeTree = useConfectMutationFn(refs.public.trees.remove);

    const remove = useMutation({
        mutationFn: () => removeTree({ id: tree._id }),
        onSuccess: () => toast.success("Baum gelöscht"),
        onError: (error) => toastConfectError("Fehler beim Löschen", error),
    });

    const vitalityColor =
        TREE_VITALITY_COLORS[
            tree.vitality as keyof typeof TREE_VITALITY_COLORS
        ];

    return (
        <Item size="sm" variant="muted">
            <ItemContent>
                <ItemTitle>
                    {species?.deName ?? getSpeciesDisplayName(species)}{" "}
                    <Badge variant="outline" className={vitalityColor}>
                        {
                            TREE_VITALITY[
                                tree.vitality as keyof typeof TREE_VITALITY
                            ]
                        }
                    </Badge>
                    {tree.plateNumber && (
                        <Badge variant="outline">{tree.plateNumber}</Badge>
                    )}
                </ItemTitle>
                <ItemDescription>{species?.botanicalName}</ItemDescription>
                <div className="min-w-0 flex-1">
                    {tree.nextControlAt && (
                        <p className="text-muted-foreground mt-2 text-xs">
                            Nächste Kontrolle:{" "}
                            {new Date(tree.nextControlAt).toLocaleDateString(
                                "de-DE",
                            )}
                        </p>
                    )}
                    {tree.notes && (
                        <p className="text-muted-foreground mt-1 truncate text-xs">
                            {tree.notes}
                        </p>
                    )}
                </div>
            </ItemContent>
            <ItemActions>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditOpen(true)}
                    aria-label="Baum bearbeiten"
                >
                    <IconPencil className="size-3.5" />
                </Button>
                <TreeFormDialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    locationId={tree.locationId}
                    tree={tree}
                />

                <AlertDialog>
                    <AlertDialogTrigger
                        render={
                            <Button
                                variant="destructive"
                                size="icon-sm"
                                isLoading={remove.isPending}
                                aria-label="Baum löschen"
                            />
                        }
                    >
                        <IconTrash className="size-3.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Baum löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Diese Aktion kann nicht rückgängig gemacht
                                werden.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate()}>
                                Löschen
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </ItemActions>
        </Item>
    );
}
