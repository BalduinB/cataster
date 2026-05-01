import { FunctionSpec, GenericId, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import { TreeCreateArgs, TreeUpdateArgs } from "@cataster/validators";

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
    args: TreeCreateArgs,
    returns: GenericId.GenericId("trees"),
});

const update = FunctionSpec.publicMutation({
    name: "update",
    args: TreeUpdateArgs,
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
