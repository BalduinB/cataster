import { FunctionSpec, GenericId, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import { locations as locationsTable } from "./schema";

const LatLng = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
});

const list = FunctionSpec.publicQuery({
  name: "list",
  args: Schema.Struct({}),
  returns: Schema.Array(locationsTable.Doc),
});

const get = FunctionSpec.publicQuery({
  name: "get",
  args: Schema.Struct({ id: GenericId.GenericId("locations") }),
  returns: Schema.NullOr(locationsTable.Doc),
});

const create = FunctionSpec.publicMutation({
  name: "create",
  args: Schema.Struct({
    name: Schema.String,
    osmId: Schema.Number,
    osmType: Schema.String,
    polygon: Schema.Array(Schema.Array(LatLng)),
    centroid: LatLng,
  }),
  returns: GenericId.GenericId("locations"),
});

const update = FunctionSpec.publicMutation({
  name: "update",
  args: Schema.Struct({
    id: GenericId.GenericId("locations"),
    name: Schema.String,
  }),
  returns: Schema.Null,
});

const remove = FunctionSpec.publicMutation({
  name: "remove",
  args: Schema.Struct({ id: GenericId.GenericId("locations") }),
  returns: Schema.Null,
});

export const locations = GroupSpec.make("locations")
  .addFunction(list)
  .addFunction(get)
  .addFunction(create)
  .addFunction(update)
  .addFunction(remove);
