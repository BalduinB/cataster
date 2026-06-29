import { FunctionSpec, GenericId, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import {
    AuthErrorUnion,
    LocationCreateArgs,
    LocationRenameArgs,
    ReadErrorUnion,
    WriteErrorUnion,
} from "@cataster/validators";

import { locations as locationsTable } from "./schema";

const list = FunctionSpec.publicQuery({
    name: "list",
    args: Schema.Struct({}),
    returns: Schema.Array(locationsTable.Doc),
    error: AuthErrorUnion,
});

const get = FunctionSpec.publicQuery({
    name: "get",
    args: Schema.Struct({ id: GenericId.GenericId("locations") }),
    returns: locationsTable.Doc,
    error: ReadErrorUnion,
});

const create = FunctionSpec.publicMutation({
    name: "create",
    args: LocationCreateArgs,
    returns: GenericId.GenericId("locations"),
    error: WriteErrorUnion,
});

const update = FunctionSpec.publicMutation({
    name: "update",
    args: LocationRenameArgs,
    returns: Schema.Null,
    error: WriteErrorUnion,
});

const remove = FunctionSpec.publicMutation({
    name: "remove",
    args: Schema.Struct({ id: GenericId.GenericId("locations") }),
    returns: Schema.Null,
    error: WriteErrorUnion,
});

export const locations = GroupSpec.make("locations")
    .addFunction(list)
    .addFunction(get)
    .addFunction(create)
    .addFunction(update)
    .addFunction(remove);
