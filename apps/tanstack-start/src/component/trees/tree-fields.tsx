import type { Schema } from "effect";

import { FieldGroup, FieldSet } from "@cataster/ui/components/base/field";
import { SelectItem } from "@cataster/ui/components/base/select";
import { isFieldInvalid } from "@cataster/ui/components/form/components/base";
import { withForm } from "@cataster/ui/components/form/hooks";
import type { SpeciesId} from "@cataster/validators";
import { TreeCreateArgs } from "@cataster/validators";

import { TREE_VITALITY_OPTIONS } from "~/lib/tree-constants";
import { SpeciesCombobox } from "./species-combobox";

export const TreeFormSchema = TreeCreateArgs.omit("locationId");
export type TreeFormSchema = Schema.Schema.Type<typeof TreeFormSchema>;
export const TreeFormFields = withForm({
    defaultValues: {} as TreeFormSchema,
    render: function Render({ form }) {
        return (
            <FieldSet disabled={form.state.isSubmitting}>
                <FieldGroup>
                    <form.AppField name="speciesId">
                        {(field) => (
                            <SpeciesCombobox
                                value={(field.state.value) || ""}
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
                                <field.Select
                                    label="Vitalität"
                                    items={TREE_VITALITY_OPTIONS}
                                >
                                    {TREE_VITALITY_OPTIONS.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
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
        );
    },
});
