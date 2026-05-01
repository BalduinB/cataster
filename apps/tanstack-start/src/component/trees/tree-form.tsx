import type { ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Schema } from "effect";
import { toast } from "sonner";

import type { LocationId, TreeDoc } from "@cataster/backend/types";
import type { SpeciesId } from "@cataster/validators";
import refs from "@cataster/backend/confect/_generated/refs";
import { getEditedFields, isDirty } from "@cataster/ui/components/form/helper";
import { useAppForm } from "@cataster/ui/components/form/hooks";

import { useConfectMutationFn } from "~/lib/confect";
import { toastConfectError } from "~/lib/error-toast";
import { TreeFormFields, TreeFormSchema } from "./tree-fields";

export const DEFAULT_CONTROL_TIMEZONE = "Europe/Berlin";
export interface TreeFormRenderContext {
    form: any;
    isPending: boolean;
}

interface TreeCreateFormProps {
    locationId: LocationId;
    treePosition: { lat: number; lng: number };
    onSuccess: () => void;
    renderFooter: (ctx: TreeFormRenderContext) => ReactNode;
}

export function TreeCreateForm({
    locationId,
    treePosition,
    onSuccess,
    renderFooter,
}: TreeCreateFormProps) {
    const addTree = useConfectMutationFn(refs.public.trees.create);
    const submitMutation = useMutation({
        mutationFn: (value: TreeFormSchema) =>
            addTree({
                locationId,
                plateNumber: value.plateNumber,
                speciesId: value.speciesId,
                circumference: value.circumference,
                height: value.height,
                crownDiameter: Number(value.crownDiameter),
                vitality: value.vitality,
                notes: value.notes,
                controlIntervalRRule: value.controlIntervalRRule,
                controlTimezone: value.controlTimezone,
                additionalControlAt: null,
                latitude: treePosition.lat,
                longitude: treePosition.lng,
            }),
        onSuccess: () => {
            toast.success("Baum erstellt");
            onSuccess();
        },
        onError: (error) => {
            toastConfectError("Fehler beim Speichern", error);
        },
    });

    const form = useAppForm({
        defaultValues: {
            controlTimezone: DEFAULT_CONTROL_TIMEZONE,
            additionalControlAt: null,
            controlIntervalRRule: null,
            notes: null,
            plateNumber: null,
            latitude: treePosition.lat,
            longitude: treePosition.lng,
        } as TreeFormSchema,
        validators: {
            onSubmit: Schema.standardSchemaV1(TreeFormSchema),
        },
        onSubmit: async ({ value }) => await submitMutation.mutateAsync(value),
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit();
            }}
        >
            <TreeFormFields form={form} />
            {renderFooter({ form, isPending: submitMutation.isPending })}
        </form>
    );
}

interface TreeEditFormProps {
    tree: TreeDoc;
    onSuccess: () => void;
    renderFooter: (ctx: TreeFormRenderContext) => ReactNode;
}
export function TreeEditForm({
    tree,
    onSuccess,
    renderFooter,
}: TreeEditFormProps) {
    const updateTree = useConfectMutationFn(refs.public.trees.update);

    const submitMutation = useMutation({
        mutationFn: updateTree,
        onSuccess: () => {
            toast.success("Baum aktualisiert");
            onSuccess();
        },
        onError: (error) => {
            toastConfectError("Fehler beim Speichern", error);
        },
    });

    const form = useAppForm({
        defaultValues: {
            plateNumber: tree.plateNumber,
            speciesId: tree.speciesId,
            circumference: tree.circumference,
            height: tree.height,
            crownDiameter: tree.crownDiameter,
            vitality: tree.vitality,
            notes: tree.notes,
            additionalControlAt: tree.additionalControlAt,
            controlIntervalRRule: tree.controlIntervalRRule,
            controlTimezone: tree.controlTimezone,
            longitude: tree.longitude,
            latitude: tree.latitude,
        } as TreeFormSchema,
        validators: {
            onSubmit: Schema.standardSchemaV1(TreeFormSchema),
        },
        onSubmit: async ({ formApi }) => {
            if (!isDirty(formApi))
                return toast.info("Keine Änderungen vorgenommen");
            const editedFields = getEditedFields(formApi);
            await submitMutation.mutateAsync({ id: tree._id, ...editedFields });
        },
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit();
            }}
        >
            <TreeFormFields form={form} />
            {renderFooter({ form, isPending: submitMutation.isPending })}
        </form>
    );
}
