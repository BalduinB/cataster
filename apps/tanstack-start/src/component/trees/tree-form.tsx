import { type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import refs from "@cataster/backend/confect/_generated/refs";
import type {
  LocationId,
  SpeciesId,
  TreeDoc,
} from "@cataster/backend/types";
import { FieldGroup, FieldSet } from "@cataster/ui/components/base/field";
import { SelectItem } from "@cataster/ui/components/base/select";
import { isFieldInvalid } from "@cataster/ui/components/form/components/base";
import { useAppForm } from "@cataster/ui/components/form/hooks";

import { useConfectMutationFn } from "~/lib/confect";
import { toastConfectError } from "~/lib/error-toast";
import { TREE_VITALITY_OPTIONS } from "~/lib/tree-constants";
import { SpeciesCombobox } from "./species-combobox";

export const DEFAULT_CONTROL_TIMEZONE = "Europe/Berlin";

const TreeSchema = z.object({
  plateNumber: z.string(),
  speciesId: z.string().min(1, "Baumart ist erforderlich"),
  circumference: z
    .string()
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0,
      { message: "Umfang muss größer als 0 sein" },
    ),
  height: z
    .string()
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0,
      { message: "Höhe muss größer als 0 sein" },
    ),
  crownDiameter: z
    .string()
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
      { message: "Kronendurchmesser muss 0 oder größer sein" },
    ),
  vitality: z.enum(["0", "1", "2", "3", "4"]),
  notes: z.string(),
  controlIntervalRRule: z.string(),
  controlTimezone: z.string().min(1),
});

export type TreeFormMode = "create" | "edit";

export type TreeFormRenderContext = {
  // The TanStack Form API surface produced by `createFormHook` is enormous
  // and not feasible to spell here; the intentional `any` keeps callers
  // ergonomic without us mirroring the whole inferred type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  isPending: boolean;
};

interface TreeFormProps {
  mode: TreeFormMode;
  locationId: LocationId;
  /** Required for `create`; ignored when editing (existing position is used). */
  treePosition: { lat: number; lng: number } | null;
  tree: TreeDoc | null;
  onSuccess: () => void;
  renderFooter: (ctx: TreeFormRenderContext) => ReactNode;
}

export function TreeForm({
  mode,
  locationId,
  treePosition,
  tree,
  onSuccess,
  renderFooter,
}: TreeFormProps) {
  const createTree = useConfectMutationFn(refs.public.trees.create);
  const updateTree = useConfectMutationFn(refs.public.trees.update);

  const isEditing = mode === "edit" && !!tree;

  const submit = useMutation({
    mutationFn: async (value: z.infer<typeof TreeSchema>) => {
      if (isEditing && tree) {
        await updateTree({
          id: tree._id,
          plateNumber: value.plateNumber.trim() || null,
          speciesId: value.speciesId as SpeciesId,
          circumference: Number(value.circumference),
          height: Number(value.height),
          crownDiameter: Number(value.crownDiameter),
          vitality: Number(value.vitality),
          notes: value.notes.trim() || null,
          controlIntervalRRule: value.controlIntervalRRule.trim() || null,
          controlTimezone: value.controlTimezone,
        });
        return "edit" as const;
      }
      if (mode === "create" && treePosition) {
        await createTree({
          locationId,
          plateNumber: value.plateNumber.trim() || undefined,
          speciesId: value.speciesId as SpeciesId,
          circumference: Number(value.circumference),
          height: Number(value.height),
          crownDiameter: Number(value.crownDiameter),
          vitality: Number(value.vitality),
          notes: value.notes.trim() || undefined,
          controlIntervalRRule: value.controlIntervalRRule.trim() || undefined,
          controlTimezone: value.controlTimezone,
          latitude: treePosition.lat,
          longitude: treePosition.lng,
        });
        return "create" as const;
      }
      throw new Error("invalid form state");
    },
    onSuccess: (kind) => {
      toast.success(kind === "edit" ? "Baum aktualisiert" : "Baum erstellt");
      onSuccess();
    },
    onError: (error) => {
      toastConfectError("Fehler beim Speichern", error);
    },
  });

  const form = useAppForm({
    defaultValues: {
      plateNumber: tree?.plateNumber ?? "",
      speciesId: tree?.speciesId ? String(tree.speciesId) : "",
      circumference: tree ? String(tree.circumference) : "",
      height: tree ? String(tree.height) : "",
      crownDiameter: tree ? String(tree.crownDiameter) : "",
      vitality: tree ? String(tree.vitality) : "1",
      notes: tree?.notes ?? "",
      controlIntervalRRule: tree?.controlIntervalRRule ?? "",
      controlTimezone: tree?.controlTimezone ?? DEFAULT_CONTROL_TIMEZONE,
    },
    validators: { onSubmit: TreeSchema },
    onSubmit: ({ value }) =>
      submit
        .mutateAsync(value as z.infer<typeof TreeSchema>)
        .catch(() => undefined),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldSet disabled={form.state.isSubmitting || submit.isPending}>
        <FieldGroup>
          <form.AppField name="speciesId">
            {(field) => (
              <SpeciesCombobox
                value={(field.state.value as SpeciesId) || ""}
                onValueChange={(id) => field.handleChange(id)}
                invalid={isFieldInvalid(field.state.meta)}
              />
            )}
          </form.AppField>

          <form.AppField name="plateNumber">
            {(field) => (
              <field.Input
                label="Plakettennummer"
                placeholder="Optionale Kennung"
              />
            )}
          </form.AppField>

          <div className="grid gap-4 md:grid-cols-2">
            <form.AppField name="circumference">
              {(field) => (
                <field.Input
                  label="Umfang"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="z.B. 1.25"
                />
              )}
            </form.AppField>

            <form.AppField name="height">
              {(field) => (
                <field.Input
                  label="Höhe"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="z.B. 8.5"
                />
              )}
            </form.AppField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <form.AppField name="crownDiameter">
              {(field) => (
                <field.Input
                  label="Kronendurchmesser"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="z.B. 4.2"
                />
              )}
            </form.AppField>

            <form.AppField name="vitality">
              {(field) => (
                <field.Select label="Vitalität" items={TREE_VITALITY_OPTIONS}>
                  {TREE_VITALITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </field.Select>
              )}
            </form.AppField>
          </div>

          <form.AppField name="controlIntervalRRule">
            {(field) => (
              <field.Textarea
                label="Kontrollintervall (RRULE)"
                description="Optional. Eine ICS RRULE-Zeile, z.B. FREQ=YEARLY;INTERVAL=1. Leer lassen, wenn keine wiederkehrende Kontrolle gewünscht ist."
                placeholder="FREQ=YEARLY;INTERVAL=1"
                rows={2}
              />
            )}
          </form.AppField>

          <form.AppField name="notes">
            {(field) => (
              <field.Textarea
                label="Notizen"
                placeholder="Beobachtungen, Mängel oder Arbeitshinweise..."
                rows={4}
              />
            )}
          </form.AppField>
        </FieldGroup>
      </FieldSet>
      {renderFooter({ form, isPending: submit.isPending })}
    </form>
  );
}
