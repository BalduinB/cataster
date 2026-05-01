import { Schema } from "effect";

/**
 * Geographic point (WGS84 lat/lng). Used by location polygons, tree positions,
 * and OSM responses; one definition shared between specs and frontend.
 */
export const LatLng = Schema.Struct({
    lat: Schema.Number,
    lng: Schema.Number,
});
export type LatLng = Schema.Schema.Type<typeof LatLng>;

/**
 * Tree vitality classification, 0 (dead) through 4 (excellent). Strict literal
 * union so the form picker, the wire payload, and the database column all
 * agree on the allowed values.
 */
export const Vitality = Schema.Literal(0, 1, 2, 3, 4);
export type Vitality = Schema.Schema.Type<typeof Vitality>;

/**
 * Branded Clerk organization id (e.g. `org_2x...`). The brand prevents
 * arbitrary strings from being passed where an org id is expected; construct
 * via the schema decoder when parsing identity claims.
 */
export const OrgId = Schema.String.pipe(Schema.brand("OrgId"));
export type OrgId = Schema.Schema.Type<typeof OrgId>;
