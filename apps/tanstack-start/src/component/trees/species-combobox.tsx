import { useState } from "react";
import { QueryResult, useQuery } from "@confect/react";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";

import type { SpeciesId } from "@cataster/backend/types";
import refs from "@cataster/backend/confect/_generated/refs";
import { Button } from "@cataster/ui/components/base/button";
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@cataster/ui/components/base/combobox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@cataster/ui/components/base/dialog";
import { Input } from "@cataster/ui/components/base/input";
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@cataster/ui/components/base/item";
import { Label } from "@cataster/ui/components/base/label";
import { FormBase } from "@cataster/ui/components/form/components/base";

import { useConfectMutation } from "~/lib/confect";

interface SpeciesComboboxProps {
    disabled?: boolean;
    invalid?: boolean;
    value: SpeciesId | "";
    onValueChange: (id: SpeciesId) => void;
}

export function SpeciesCombobox({
    value,
    onValueChange,
    disabled,
    invalid,
}: SpeciesComboboxProps) {
    const speciesQuery = useQuery(refs.public.species.listActive, {});
    const species = QueryResult.isSuccess(speciesQuery)
        ? speciesQuery.value
        : [];
    const [open, setOpen] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    return (
        <>
            <FormBase label="Baumart">
                <Combobox<string>
                    value={value}
                    onValueChange={(next) =>
                        next ? onValueChange(next as SpeciesId) : undefined
                    }
                    open={open}
                    onOpenChange={setOpen}
                    itemToStringLabel={(s) =>
                        species.find((sp) => sp._id === s)?.deName ??
                        "Nicht gefunden"
                    }
                    disabled={disabled}
                >
                    <ComboboxInput
                        placeholder="Art auswählen"
                        aria-invalid={invalid}
                    />
                    <ComboboxContent>
                        <ComboboxList>
                            {species.map((sp) => (
                                <ComboboxItem
                                    key={sp._id}
                                    value={sp._id}
                                    render={
                                        <Item size="xs" className="p-0">
                                            <ItemContent>
                                                <ItemTitle className="whitespace-nowrap">
                                                    {sp.deName}
                                                </ItemTitle>
                                                <ItemDescription>
                                                    {sp.botanicalName}
                                                </ItemDescription>
                                            </ItemContent>
                                        </Item>
                                    }
                                />
                            ))}
                        </ComboboxList>
                        <div className="p-2">
                            <Button
                                className="w-full"
                                onClick={() => {
                                    setOpen(false);
                                    setAddDialogOpen(true);
                                }}
                            >
                                <IconPlus data-icon="inline-start" />
                                Baumart erstellen
                            </Button>
                        </div>
                    </ComboboxContent>
                </Combobox>
            </FormBase>

            <AddSpeciesDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onCreated={(speciesId) => onValueChange(speciesId)}
            />
        </>
    );
}

function AddSpeciesDialog({
    open,
    onOpenChange,
    onCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (speciesId: SpeciesId) => void;
}) {
    const [deName, setDeName] = useState("");
    const [botanicalName, setBotanicalName] = useState("");

    const reset = () => {
        setDeName("");
        setBotanicalName("");
    };

    const create = useConfectMutation(refs.public.species.create, {
        onSuccess: (speciesId) => {
            onCreated(speciesId);
            reset();
            onOpenChange(false);
            toast.success("Baumart erstellt");
        },
    });

    const handleSubmit = () => {
        const trimmedDeName = deName.trim();
        const trimmedBotanicalName = botanicalName.trim();
        if (!trimmedDeName || !trimmedBotanicalName) {
            toast.error("Bitte beide Bezeichnungen eingeben.");
            return;
        }
        create.mutate({
            deName: trimmedDeName,
            botanicalName: trimmedBotanicalName,
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) reset();
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Baumart anlegen</DialogTitle>
                    <DialogDescription>
                        Lege eine neue Baumart an und wähle sie direkt aus.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="species-de-name">Deutscher Name</Label>
                        <Input
                            id="species-de-name"
                            value={deName}
                            onChange={(e) => setDeName(e.target.value)}
                            placeholder="z.B. Linde"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="species-botanical-name">
                            Botanischer Name
                        </Label>
                        <Input
                            id="species-botanical-name"
                            value={botanicalName}
                            onChange={(e) => setBotanicalName(e.target.value)}
                            placeholder="z.B. Tilia cordata"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Abbrechen
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        isLoading={create.isPending}
                    >
                        Baumart erstellen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
