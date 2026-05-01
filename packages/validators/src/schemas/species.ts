import { GenericId } from "@confect/core";
import { Schema } from "effect";

export const SpeciesId = GenericId.GenericId("species");
export type SpeciesId = Schema.Schema.Type<typeof SpeciesId>;

export const SpeciesCreateArgs = Schema.Struct({
    deName: Schema.String,
    botanicalName: Schema.String,
});
export type SpeciesCreateArgs = Schema.Schema.Type<typeof SpeciesCreateArgs>;
