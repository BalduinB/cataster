import { GenericId } from "@confect/core";
import { Schema } from "effect";

import { LatLng } from "./primitives";

export const LocationId = GenericId.GenericId("locations");
export type LocationId = Schema.Schema.Type<typeof LocationId>;
export const LocationCreateArgs = Schema.Struct({
    name: Schema.String,
    osmId: Schema.Number,
    osmType: Schema.String,
    polygon: Schema.Array(Schema.Array(LatLng)),
    centroid: LatLng,
});
export type LocationCreateArgs = Schema.Schema.Type<typeof LocationCreateArgs>;

export const LocationRenameArgs = Schema.Struct({
    id: LocationId,
    name: Schema.String,
});
export type LocationRenameArgs = Schema.Schema.Type<typeof LocationRenameArgs>;
