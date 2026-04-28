import { Schema } from "effect";

/**
 * Effect-Schema models for the subset of Nominatim and Overpass response
 * payloads that we read. The schemas are used to decode raw JSON, so any
 * upstream shape change becomes a typed `ParseError` instead of an
 * `undefined` somewhere downstream.
 */

const StringFromNumber = Schema.transform(Schema.Number, Schema.String, {
  decode: (n) => String(n),
  encode: (s) => Number(s),
  strict: true,
});

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
  geometry: Schema.optionalWith(Schema.Array(OverpassNode), { exact: true }),
});

const OverpassRelationMember = Schema.Struct({
  type: Schema.String,
  role: Schema.String,
  geometry: Schema.optionalWith(Schema.Array(OverpassNode), { exact: true }),
});

const OverpassRelation = Schema.Struct({
  type: Schema.Literal("relation"),
  members: Schema.optionalWith(Schema.Array(OverpassRelationMember), {
    exact: true,
  }),
});

const OverpassElement = Schema.Union(OverpassWay, OverpassRelation);

export const OverpassResponse = Schema.Struct({
  elements: Schema.Array(OverpassElement),
});
export type OverpassResponse = Schema.Schema.Type<typeof OverpassResponse>;
