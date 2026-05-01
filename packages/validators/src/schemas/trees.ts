import { GenericId } from "@confect/core";
import { Schema } from "effect";

import { emptyStringToNull, nonEmptyString } from "./helpers";
import { LocationId } from "./locations";
import { Vitality } from "./primitives";
import { SpeciesId } from "./species";

export const TreeCreateArgs = Schema.Struct({
    locationId: LocationId,
    plateNumber: emptyStringToNull(),
    speciesId: SpeciesId,
    circumference: Schema.Number,
    height: Schema.Number,
    crownDiameter: Schema.Number,
    vitality: Vitality,
    notes: emptyStringToNull(),
    controlIntervalRRule: emptyStringToNull(),
    controlTimezone: nonEmptyString(),
    additionalControlAt: Schema.NullOr(Schema.Number),
    latitude: Schema.Number,
    longitude: Schema.Number,
});
export type TreeCreateArgs = Schema.Schema.Type<typeof TreeCreateArgs>;

export const TreeUpdateArgs = Schema.Struct({
    id: GenericId.GenericId("trees"),
    plateNumber: Schema.optionalWith(Schema.NullOr(Schema.String), {
        exact: true,
    }),
    speciesId: Schema.optionalWith(SpeciesId, { exact: true }),
    circumference: Schema.optionalWith(Schema.Number, { exact: true }),
    height: Schema.optionalWith(Schema.Number, { exact: true }),
    crownDiameter: Schema.optionalWith(Schema.Number, { exact: true }),
    vitality: Schema.optionalWith(Vitality, { exact: true }),
    notes: Schema.optionalWith(Schema.NullOr(Schema.String), { exact: true }),
    controlIntervalRRule: Schema.optionalWith(Schema.NullOr(Schema.String), {
        exact: true,
    }),
    controlTimezone: Schema.optionalWith(Schema.String, { exact: true }),
    additionalControlAt: Schema.optionalWith(Schema.NullOr(Schema.Number), {
        exact: true,
    }),
    latitude: Schema.optionalWith(Schema.Number, { exact: true }),
    longitude: Schema.optionalWith(Schema.Number, { exact: true }),
});
export type TreeUpdateArgs = Schema.Schema.Type<typeof TreeUpdateArgs>;
