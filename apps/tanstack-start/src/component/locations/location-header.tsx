import { useState } from "react";
import {
    IconMapPin,
    IconPencil,
    IconPlus,
    IconTrash,
} from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { LocationDoc } from "@cataster/backend/types";
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
import { Button } from "@cataster/ui/components/base/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@cataster/ui/components/base/dialog";
import { Input } from "@cataster/ui/components/base/input";

import { useConfectMutationFn } from "~/lib/confect";
import { toastConfectError } from "~/lib/error-toast";

interface LocationHeaderProps {
    location: LocationDoc;
}

export function LocationHeader({ location }: LocationHeaderProps) {
    const navigate = useNavigate();
    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState(location.name);

    const renameLocation = useConfectMutationFn(refs.public.locations.update);
    const deleteLocation = useConfectMutationFn(refs.public.locations.remove);

    const rename = useMutation({
        mutationFn: (name: string) =>
            renameLocation({ id: location._id, name }),
        onSuccess: () => {
            toast.success("Standort aktualisiert");
            setEditOpen(false);
        },
        onError: (error) =>
            toastConfectError("Fehler beim Aktualisieren", error),
    });

    const remove = useMutation({
        mutationFn: () => deleteLocation({ id: location._id }),
        onSuccess: () => {
            toast.success("Standort gelöscht");
            void navigate({ to: "/app/locations" });
        },
        onError: (error) => toastConfectError("Fehler beim Löschen", error),
    });

    const handleUpdate = () => {
        const trimmed = editName.trim();
        if (!trimmed) return;
        rename.mutate(trimmed);
    };

    return (
        <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <IconMapPin className="text-primary size-6" />
                {location.name}
            </h1>
            <div className="flex items-center gap-2">
                <Button
                    className="gap-2"
                    render={
                        <Link
                            to="/app/locations/$id/create-tree"
                            params={{ id: location._id }}
                        />
                    }
                >
                    <IconPlus className="size-4" />
                    Neuer Baum
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditOpen(true)}
                    aria-label="Standort umbenennen"
                >
                    <IconPencil />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger
                        render={
                            <Button
                                variant="destructive"
                                size="icon"
                                isLoading={remove.isPending}
                                aria-label="Standort löschen"
                            />
                        }
                    >
                        <IconTrash />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Standort löschen?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Alle zugehörigen Bäume werden ebenfalls
                                gelöscht. Diese Aktion kann nicht rückgängig
                                gemacht werden.
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
            </div>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Standort umbenennen</DialogTitle>
                    </DialogHeader>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                    />
                    <DialogFooter>
                        <DialogClose render={<Button variant="ghost" />}>
                            Abbrechen
                        </DialogClose>
                        <Button
                            onClick={handleUpdate}
                            isLoading={rename.isPending}
                        >
                            Speichern
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
