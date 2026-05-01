import { Schema } from "effect";

import { LatLng } from "./primitives";

export const OsmSearchArgs = Schema.Struct({ query: Schema.String });

export const OsmFetchBoundaryArgs = Schema.Struct({
    osmId: Schema.Number,
    osmType: Schema.String,
});

export const OsmSearchResult = Schema.Struct({
    osmId: Schema.Number,
    osmType: Schema.String,
    displayName: Schema.String,
    lat: Schema.Number,
    lng: Schema.Number,
    type: Schema.String,
});
export type OsmSearchResult = Schema.Schema.Type<typeof OsmSearchResult>;

export const OsmBoundary = Schema.Struct({
    polygon: Schema.Array(Schema.Array(LatLng)),
    centroid: LatLng,
});
export type OsmBoundary = Schema.Schema.Type<typeof OsmBoundary>;
