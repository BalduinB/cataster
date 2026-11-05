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
    plateNumber: Schema.optionalKey(Schema.NullOr(Schema.String)),
    speciesId: Schema.optionalKey(SpeciesId),
    circumference: Schema.optionalKey(Schema.Number),
    height: Schema.optionalKey(Schema.Number),
    crownDiameter: Schema.optionalKey(Schema.Number),
    vitality: Schema.optionalKey(Vitality),
    notes: Schema.optionalKey(Schema.NullOr(Schema.String)),
    controlIntervalRRule: Schema.optionalKey(Schema.NullOr(Schema.String)),
    controlTimezone: Schema.optionalKey(Schema.String),
    additionalControlAt: Schema.optionalKey(Schema.NullOr(Schema.Number)),
    latitude: Schema.optionalKey(Schema.Number),
    longitude: Schema.optionalKey(Schema.Number),
});
export type TreeUpdateArgs = Schema.Schema.Type<typeof TreeUpdateArgs>;
