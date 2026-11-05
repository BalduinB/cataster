import { Schema } from "effect";

/**
 * Effect-Schema models for the subset of Nominatim and Overpass response
 * payloads that we read. The schemas are used to decode raw JSON, so any
 * upstream shape change becomes a typed `SchemaError` instead of an
 * `undefined` somewhere downstream.
 */

export const NominatimResult = Schema.Struct({
    osm_id: Schema.Number,
    osm_type: Schema.String,
    display_name: Schema.String,
    lat: Schema.NumberFromString,
    lon: Schema.NumberFromString,
    type: Schema.String,
});
export type NominatimResult = Schema.Schema.Type<typeof NominatimResult>;

export const NominatimResults = Schema.Array(NominatimResult);

const OverpassNode = Schema.Struct({
    lat: Schema.Number,
    lon: Schema.Number,
});

const OverpassWay = Schema.Struct({
    type: Schema.Literal("way"),
    geometry: Schema.optionalKey(Schema.Array(OverpassNode)),
});

const OverpassRelationMember = Schema.Struct({
    type: Schema.String,
    role: Schema.String,
    geometry: Schema.optionalKey(Schema.Array(OverpassNode)),
});

const OverpassRelation = Schema.Struct({
    type: Schema.Literal("relation"),
    members: Schema.optionalKey(Schema.Array(OverpassRelationMember)),
});

const OverpassElement = Schema.Union([OverpassWay, OverpassRelation]);

export const OverpassResponse = Schema.Struct({
    elements: Schema.Array(OverpassElement),
});
export type OverpassResponse = Schema.Schema.Type<typeof OverpassResponse>;
