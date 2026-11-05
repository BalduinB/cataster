import { FunctionImpl, GroupImpl } from "@confect/server";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { requireAbility, ServicesLive, SpeciesService } from "../services";
import databaseSchema from "./_generated/schema";
import species from "./species.spec";

const listActive = FunctionImpl.make(
    databaseSchema,
    species,
    "listActive",
    () =>
        Effect.gen(function* () {
            yield* requireAbility("read", "Species");
            return yield* SpeciesService.listForOrg();
        }).pipe(Effect.provide(ServicesLive)),
);

const create = FunctionImpl.make(
    databaseSchema,
    species,
    "create",
    ({ deName, botanicalName }) =>
        Effect.gen(function* () {
            yield* requireAbility("create", "Species");
            const existing = yield* SpeciesService.listForOrg();
            return yield* SpeciesService.upsertForOrg({
                deName,
                botanicalName,
                sortOrder: existing.length,
            });
        }).pipe(Effect.provide(ServicesLive)),
);

const remove = FunctionImpl.make(databaseSchema, species, "remove", ({ id }) =>
    Effect.gen(function* () {
        yield* requireAbility("delete", "Species");
        yield* SpeciesService.removeForOrg(id);
        return null;
    }).pipe(Effect.provide(ServicesLive)),
);

const hideSystem = FunctionImpl.make(
    databaseSchema,
    species,
    "hideSystem",
    ({ id }) =>
        Effect.gen(function* () {
            yield* requireAbility("manage", "HiddenSpecies");
            yield* SpeciesService.hideSystemForOrg(id);
            return null;
        }).pipe(Effect.provide(ServicesLive)),
);

const unhideSystem = FunctionImpl.make(
    databaseSchema,
    species,
    "unhideSystem",
    ({ id }) =>
        Effect.gen(function* () {
            yield* requireAbility("manage", "HiddenSpecies");
            yield* SpeciesService.unhideSystemForOrg(id);
            return null;
        }).pipe(Effect.provide(ServicesLive)),
);

const seedDefaults = FunctionImpl.make(
    databaseSchema,
    species,
    "seedDefaults",
    () => SpeciesService.seedDefaults().pipe(Effect.provide(ServicesLive)),
);

export default GroupImpl.make(databaseSchema, species).pipe(
    Layer.provide(listActive),
    Layer.provide(create),
    Layer.provide(remove),
    Layer.provide(hideSystem),
    Layer.provide(unhideSystem),
    Layer.provide(seedDefaults),
    GroupImpl.finalize,
);
