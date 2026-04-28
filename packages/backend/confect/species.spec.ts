import { FunctionSpec, GenericId, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import { species as speciesTable } from "./schema";

const listActive = FunctionSpec.publicQuery({
  name: "listActive",
  args: Schema.Struct({}),
  returns: Schema.Array(speciesTable.Doc),
});

const create = FunctionSpec.publicMutation({
  name: "create",
  args: Schema.Struct({
    deName: Schema.String,
    botanicalName: Schema.String,
  }),
  returns: GenericId.GenericId("species"),
});

const seedDefaults = FunctionSpec.publicMutation({
  name: "seedDefaults",
  args: Schema.Struct({}),
  returns: Schema.Array(GenericId.GenericId("species")),
});

export const species = GroupSpec.make("species")
  .addFunction(listActive)
  .addFunction(create)
  .addFunction(seedDefaults);
