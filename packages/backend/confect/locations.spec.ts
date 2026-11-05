import { FunctionSpec, GroupSpec } from "@confect/core";
import * as Schema from "effect/Schema";

import {
    AuthErrorUnion,
    LocationCreateArgs,
    LocationRenameArgs,
    ReadErrorUnion,
    WriteErrorUnion,
} from "@cataster/validators";

import { Id } from "./_generated/id";
import locationsTable from "./_generated/tables/locations";

const list = FunctionSpec.publicQuery({
    name: "list",
    returns: () => Schema.Array(locationsTable.Doc),
    error: () => AuthErrorUnion,
});

const get = FunctionSpec.publicQuery({
    name: "get",
    args: () => ({ id: Id("locations") }),
    returns: () => locationsTable.Doc,
    error: () => ReadErrorUnion,
});

const create = FunctionSpec.publicMutation({
    name: "create",
    args: () => LocationCreateArgs.fields,
    returns: () => Id("locations"),
    error: () => WriteErrorUnion,
});

const update = FunctionSpec.publicMutation({
    name: "update",
    args: () => LocationRenameArgs.fields,
    returns: () => Schema.Null,
    error: () => WriteErrorUnion,
});

const remove = FunctionSpec.publicMutation({
    name: "remove",
    args: () => ({ id: Id("locations") }),
    returns: () => Schema.Null,
    error: () => WriteErrorUnion,
});

export default GroupSpec.make()
    .addFunction(list)
    .addFunction(get)
    .addFunction(create)
    .addFunction(update)
    .addFunction(remove);
