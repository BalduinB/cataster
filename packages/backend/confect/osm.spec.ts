import { FunctionSpec, GroupSpec } from "@confect/core";
import { Schema } from "effect";

const LatLng = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
});

const searchAreas = FunctionSpec.publicAction({
  name: "searchAreas",
  args: Schema.Struct({ query: Schema.String }),
  returns: Schema.Array(
    Schema.Struct({
      osmId: Schema.Number,
      osmType: Schema.String,
      displayName: Schema.String,
      lat: Schema.Number,
      lng: Schema.Number,
      type: Schema.String,
    }),
  ),
});

const fetchBoundary = FunctionSpec.publicAction({
  name: "fetchBoundary",
  args: Schema.Struct({
    osmId: Schema.Number,
    osmType: Schema.String,
  }),
  returns: Schema.Struct({
    polygon: Schema.Array(Schema.Array(LatLng)),
    centroid: LatLng,
  }),
});

export const osm = GroupSpec.make("osm")
  .addFunction(searchAreas)
  .addFunction(fetchBoundary);
