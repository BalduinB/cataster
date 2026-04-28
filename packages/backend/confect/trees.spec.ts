import { FunctionSpec, GenericId, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import { species as speciesTable, trees as treesTable } from "./schema";

const listByLocation = FunctionSpec.publicQuery({
  name: "listByLocation",
  args: Schema.Struct({ locationId: GenericId.GenericId("locations") }),
  returns: Schema.Struct({
    trees: Schema.Array(treesTable.Doc),
    speciesById: Schema.Record({
      key: GenericId.GenericId("species"),
      value: speciesTable.Doc,
    }),
  }),
});

const get = FunctionSpec.publicQuery({
  name: "get",
  args: Schema.Struct({ id: GenericId.GenericId("trees") }),
  returns: Schema.NullOr(treesTable.Doc),
});

const create = FunctionSpec.publicMutation({
  name: "create",
  args: Schema.Struct({
    locationId: GenericId.GenericId("locations"),
    plateNumber: Schema.optionalWith(Schema.String, { exact: true }),
    speciesId: GenericId.GenericId("species"),
    circumference: Schema.Number,
    height: Schema.Number,
    crownDiameter: Schema.Number,
    vitality: Schema.Number,
    notes: Schema.optionalWith(Schema.String, { exact: true }),
    controlIntervalRRule: Schema.optionalWith(Schema.String, { exact: true }),
    controlTimezone: Schema.optionalWith(Schema.String, { exact: true }),
    additionalControlAt: Schema.optionalWith(Schema.Number, { exact: true }),
    latitude: Schema.Number,
    longitude: Schema.Number,
  }),
  returns: GenericId.GenericId("trees"),
});

const update = FunctionSpec.publicMutation({
  name: "update",
  args: Schema.Struct({
    id: GenericId.GenericId("trees"),
    plateNumber: Schema.optionalWith(Schema.NullOr(Schema.String), { exact: true }),
    speciesId: Schema.optionalWith(GenericId.GenericId("species"), { exact: true }),
    circumference: Schema.optionalWith(Schema.Number, { exact: true }),
    height: Schema.optionalWith(Schema.Number, { exact: true }),
    crownDiameter: Schema.optionalWith(Schema.Number, { exact: true }),
    vitality: Schema.optionalWith(Schema.Number, { exact: true }),
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
  }),
  returns: Schema.Null,
});

const remove = FunctionSpec.publicMutation({
  name: "remove",
  args: Schema.Struct({ id: GenericId.GenericId("trees") }),
  returns: Schema.Null,
});

const recomputeNextControlDates = FunctionSpec.internalMutation({
  name: "recomputeNextControlDates",
  args: Schema.Struct({}),
  returns: Schema.Null,
});

export const trees = GroupSpec.make("trees")
  .addFunction(listByLocation)
  .addFunction(get)
  .addFunction(create)
  .addFunction(update)
  .addFunction(remove)
  .addFunction(recomputeNextControlDates);
