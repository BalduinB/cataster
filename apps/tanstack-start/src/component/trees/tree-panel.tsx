import { useMemo, useState } from "react";
import {
    IconDots,
    IconEye,
    IconPencil,
    IconTrash,
    IconTrees,
} from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";

import type { SpeciesDoc, SpeciesId, TreeDoc } from "@cataster/backend/types";
import { subject } from "@cataster/abilities";
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
import { CardTitle } from "@cataster/ui/components/base/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@cataster/ui/components/base/dropdown-menu";
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
import { formatControlDate } from "@cataster/ui/lib/tree";

import { useAbility } from "~/lib/abilities";
import { useConfectMutationFn } from "~/lib/confect";
import { toastConfectError } from "~/lib/error-toast";
import {
    getSpeciesDisplayName,
    TREE_VITALITY,
    TREE_VITALITY_COLORS,
} from "~/lib/tree-constants";
import { useSelectedTree } from "~/store/selected-tree";
import { TreeEditFormDialog } from "./tree-form-dialog";

interface TreePanelProps {
    trees: ReadonlyArray<TreeDoc>;
    speciesById: Readonly<Record<SpeciesId, SpeciesDoc>>;
}

export function TreePanel({ trees, speciesById }: TreePanelProps) {
    const selectedTreeId = useSelectedTree((s) => s.selectedTreeId);
    const sortedTrees = useMemo(() => {
        if (!selectedTreeId) return trees;
        const idx = trees.findIndex((t) => t._id === selectedTreeId);
        if (idx <= 0) return trees;
        return [trees[idx]!, ...trees.slice(0, idx), ...trees.slice(idx + 1)];
    }, [trees, selectedTreeId]);

    return (
        <div className="md:col-span-2">
            <CardTitle className="flex items-center gap-2">
                <IconTrees className="size-5" />
                Bäume ({trees.length})
            </CardTitle>
            <ScrollArea className="max-h-[640px]">
                {trees.length === 0 ? (
                    <Empty>
                        <EmptyMedia variant="icon">
                            <IconTrees />
                        </EmptyMedia>
                        <EmptyHeader>
                            <EmptyTitle>Keine Bäume</EmptyTitle>
                            <EmptyDescription>
                                Lege den ersten Baum über &quot;Neuer Baum&quot;
                                an.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <div className="space-y-2 p-1">
                        {sortedTrees.map((tree) => (
                            <motion.div
                                key={tree._id}
                                layout
                                layoutId={tree._id}
                            >
                                <TreeItem
                                    tree={tree}
                                    species={speciesById[tree.speciesId]}
                                    isSelected={selectedTreeId === tree._id}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

function TreeItem({
    tree,
    species,
    isSelected,
}: {
    tree: TreeDoc;
    species?: SpeciesDoc;
    isSelected: boolean;
}) {
    const setSelectedTreeId = useSelectedTree((s) => s.setSelectedTreeId);

    const vitalityColor =
        TREE_VITALITY_COLORS[
            tree.vitality as keyof typeof TREE_VITALITY_COLORS
        ];

    return (
        <Item
            size="sm"
            variant="muted"
            className={isSelected ? "ring-primary ring-2" : undefined}
        >
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
                            {formatControlDate(new Date(tree.nextControlAt))}
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
                    variant={isSelected ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() =>
                        setSelectedTreeId(isSelected ? null : tree._id)
                    }
                    aria-label="Baum auf Karte hervorheben"
                >
                    <IconEye />
                </Button>
                <TreeActions tree={tree} />
            </ItemActions>
        </Item>
    );
}

function TreeActions({ tree }: { tree: TreeDoc }) {
    const [editOpen, setEditOpen] = useState(false);

    const ability = useAbility();
    const asTree = subject("Tree", { orgId: tree.orgId });
    const canDelete = ability.can("delete", asTree);
    const canUpdate = ability.can("update", asTree);
    const removeTree = useConfectMutationFn(refs.public.trees.remove);

    const remove = useMutation({
        mutationFn: () => removeTree({ id: tree._id }),
        onSuccess: () => toast.success("Baum gelöscht"),
        onError: (error) => toastConfectError("Fehler beim Löschen", error),
    });

    return (
        <>
            <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                isLoading={remove.isPending}
                                aria-label="Baum löschen"
                            />
                        }
                    >
                        <IconDots />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {canUpdate && (
                            <DropdownMenuItem onClick={() => setEditOpen(true)}>
                                <IconPencil />
                                Baum bearbeiten
                            </DropdownMenuItem>
                        )}
                        {canDelete && (
                            <AlertDialogTrigger
                                render={
                                    <DropdownMenuItem variant="destructive" />
                                }
                            >
                                <IconTrash />
                                Baum löschen
                            </AlertDialogTrigger>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Baum löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Diese Aktion kann nicht rückgängig gemacht werden.
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
            <TreeEditFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                tree={tree}
            />
        </>
    );
}
