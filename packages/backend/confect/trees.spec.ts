import { FunctionSpec, GroupSpec } from "@confect/core";
import * as Schema from "effect/Schema";

import {
    ConflictError,
    ReadErrorUnion,
    TreeCreateArgs,
    TreeUpdateArgs,
    WriteErrorUnion,
} from "@cataster/validators";

import { Id } from "./_generated/id";
import speciesTable from "./_generated/tables/species";
import treesTable from "./_generated/tables/trees";

const listByLocation = FunctionSpec.publicQuery({
    name: "listByLocation",
    args: () => Schema.Struct({ locationId: Id("locations") }),
    returns: () =>
        Schema.Struct({
            trees: Schema.Array(treesTable.Doc),
            speciesById: Schema.Record({
                key: Id("species"),
                value: speciesTable.Doc,
            }),
        }),
    error: () => ReadErrorUnion,
});

const get = FunctionSpec.publicQuery({
    name: "get",
    args: () => Schema.Struct({ id: Id("trees") }),
    returns: () => treesTable.Doc,
    error: () => ReadErrorUnion,
});

const create = FunctionSpec.publicMutation({
    name: "create",
    args: () => TreeCreateArgs,
    returns: () => Id("trees"),
    error: () => WriteErrorUnion,
});

const update = FunctionSpec.publicMutation({
    name: "update",
    args: () => TreeUpdateArgs,
    returns: () => Schema.Null,
    error: () => WriteErrorUnion,
});

const remove = FunctionSpec.publicMutation({
    name: "remove",
    args: () => Schema.Struct({ id: Id("trees") }),
    returns: () => Schema.Null,
    error: () => WriteErrorUnion,
});

const recomputeNextControlDates = FunctionSpec.internalMutation({
    name: "recomputeNextControlDates",
    args: () => Schema.Struct({}),
    returns: () => Schema.Null,
    error: () => Schema.Union(ConflictError),
});

export default GroupSpec.make()
    .addFunction(listByLocation)
    .addFunction(get)
    .addFunction(create)
    .addFunction(update)
    .addFunction(remove)
    .addFunction(recomputeNextControlDates);
