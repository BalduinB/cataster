import { type ReactElement } from "react";

import type { TreeDoc } from "@cataster/backend/types";
import { Button } from "@cataster/ui/components/base/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@cataster/ui/components/base/dialog";

import { TreeEditForm } from "./tree-form";

interface TreeFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Optional trigger element. Pass `null` to use external state only. */
    trigger?: ReactElement | null;

    tree: TreeDoc;
}

export function TreeEditFormDialog({
    open,
    onOpenChange,
    tree,
    trigger = null,
}: TreeFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger ? <DialogTrigger render={trigger} /> : null}
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Baum bearbeiten</DialogTitle>
                    <DialogDescription>
                        <span className="text-xs">
                            Position: {tree.latitude.toFixed(5)},{" "}
                            {tree.longitude.toFixed(5)}
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <TreeEditForm
                    tree={tree}
                    onSuccess={() => onOpenChange(false)}
                    renderFooter={({ form, isPending }) => (
                        <DialogFooter>
                            <DialogClose
                                render={
                                    <Button type="button" variant="ghost" />
                                }
                            >
                                Abbrechen
                            </DialogClose>
                            <form.AppForm>
                                <form.SubmitButton isLoading={isPending}>
                                    Aktualisieren
                                </form.SubmitButton>
                            </form.AppForm>
                        </DialogFooter>
                    )}
                />
            </DialogContent>
        </Dialog>
    );
}
