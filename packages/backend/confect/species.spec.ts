import { FunctionSpec, GroupSpec } from "@confect/core";
import * as Schema from "effect/Schema";

import {
    AuthErrorUnion,
    ConflictError,
    SpeciesCreateArgs,
    WriteErrorUnion,
} from "@cataster/validators";

import { Id } from "./_generated/id";
import speciesTable from "./_generated/tables/species";

const listActive = FunctionSpec.publicQuery({
    name: "listActive",
    args: () => Schema.Struct({}),
    returns: () => Schema.Array(speciesTable.Doc),
    error: () => AuthErrorUnion,
});

const create = FunctionSpec.publicMutation({
    name: "create",
    args: () => SpeciesCreateArgs,
    returns: () => Id("species"),
    error: () => WriteErrorUnion,
});

const remove = FunctionSpec.publicMutation({
    name: "remove",
    args: () => Schema.Struct({ id: Id("species") }),
    returns: () => Schema.Null,
    error: () => WriteErrorUnion,
});

const hideSystem = FunctionSpec.publicMutation({
    name: "hideSystem",
    args: () => Schema.Struct({ id: Id("species") }),
    returns: () => Schema.Null,
    error: () => WriteErrorUnion,
});

const unhideSystem = FunctionSpec.publicMutation({
    name: "unhideSystem",
    args: () => Schema.Struct({ id: Id("species") }),
    returns: () => Schema.Null,
    error: () => WriteErrorUnion,
});

/**
 * `seedDefaults` is now an internal mutation, invoked by a deploy-time init
 * cron rather than from the client. Inserts the `DEFAULT_SPECIES` constant
 * as system rows (`orgId = null`); idempotent across deploys.
 */
const seedDefaults = FunctionSpec.internalMutation({
    name: "seedDefaults",
    args: () => Schema.Struct({}),
    returns: () => Schema.Array(Id("species")),
    error: () => Schema.Union(ConflictError),
});

export default GroupSpec.make()
    .addFunction(listActive)
    .addFunction(create)
    .addFunction(remove)
    .addFunction(hideSystem)
    .addFunction(unhideSystem)
    .addFunction(seedDefaults);
