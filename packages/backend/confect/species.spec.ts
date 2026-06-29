import { FunctionSpec, GenericId, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import {
    ConflictError,
    SpeciesCreateArgs,
    AuthErrorUnion,
    WriteErrorUnion,
} from "@cataster/validators";

import { species as speciesTable } from "./schema";

const listActive = FunctionSpec.publicQuery({
    name: "listActive",
    args: Schema.Struct({}),
    returns: Schema.Array(speciesTable.Doc),
    error: AuthErrorUnion,
});

const create = FunctionSpec.publicMutation({
    name: "create",
    args: SpeciesCreateArgs,
    returns: GenericId.GenericId("species"),
    error: WriteErrorUnion,
});

const remove = FunctionSpec.publicMutation({
    name: "remove",
    args: Schema.Struct({ id: GenericId.GenericId("species") }),
    returns: Schema.Null,
    error: WriteErrorUnion,
});

const hideSystem = FunctionSpec.publicMutation({
    name: "hideSystem",
    args: Schema.Struct({ id: GenericId.GenericId("species") }),
    returns: Schema.Null,
    error: WriteErrorUnion,
});

const unhideSystem = FunctionSpec.publicMutation({
    name: "unhideSystem",
    args: Schema.Struct({ id: GenericId.GenericId("species") }),
    returns: Schema.Null,
    error: WriteErrorUnion,
});

/**
 * `seedDefaults` is now an internal mutation, invoked by a deploy-time init
 * cron rather than from the client. Inserts the `DEFAULT_SPECIES` constant
 * as system rows (`orgId = null`); idempotent across deploys.
 */
const seedDefaults = FunctionSpec.internalMutation({
    name: "seedDefaults",
    args: Schema.Struct({}),
    returns: Schema.Array(GenericId.GenericId("species")),
    error: Schema.Union(ConflictError),
});

export const species = GroupSpec.make("species")
    .addFunction(listActive)
    .addFunction(create)
    .addFunction(remove)
    .addFunction(hideSystem)
    .addFunction(unhideSystem)
    .addFunction(seedDefaults);
