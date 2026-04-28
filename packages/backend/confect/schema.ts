import { GenericId } from "@confect/core";
import { DatabaseSchema, Table } from "@confect/server";
import { Schema } from "effect";

const LatLng = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
});

export const locations = Table.make(
  "locations",
  Schema.Struct({
    name: Schema.String,
    osmId: Schema.Number,
    osmType: Schema.String,
    polygon: Schema.Array(Schema.Array(LatLng)),
    centroid: LatLng,
    updatedAt: Schema.Number,
  }),
).index("by_osmId", ["osmId"]);

export const species = Table.make(
  "species",
  Schema.Struct({
    deName: Schema.String,
    botanicalName: Schema.String,
    isActive: Schema.Boolean,
    sortOrder: Schema.Number,
    updatedAt: Schema.Number,
  }),
)
  .index("by_botanicalName", ["botanicalName"])
  .index("by_isActive_and_sortOrder", ["isActive", "sortOrder"]);

export const trees = Table.make(
  "trees",
  Schema.Struct({
    locationId: GenericId.GenericId("locations"),
    plateNumber: Schema.optionalWith(Schema.String, { exact: true }),
    speciesId: GenericId.GenericId("species"),
    circumference: Schema.Number,
    height: Schema.Number,
    crownDiameter: Schema.Number,
    vitality: Schema.Number,
    notes: Schema.optionalWith(Schema.String, { exact: true }),
    controlIntervalRRule: Schema.optionalWith(Schema.String, { exact: true }),
    controlTimezone: Schema.String,
    additionalControlAt: Schema.optionalWith(Schema.Number, { exact: true }),
    nextControlAt: Schema.optionalWith(Schema.Number, { exact: true }),
    latitude: Schema.Number,
    longitude: Schema.Number,
    updatedAt: Schema.Number,
  }),
)
  .index("by_locationId", ["locationId"])
  .index("by_locationId_and_plateNumber", ["locationId", "plateNumber"])
  .index("by_locationId_and_nextControlAt", ["locationId", "nextControlAt"])
  .index("by_speciesId", ["speciesId"]);

export default DatabaseSchema.make()
  .addTable(locations)
  .addTable(species)
  .addTable(trees);
