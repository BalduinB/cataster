import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import { requireAbility, ServicesLive, SpeciesService } from "../services";
import api from "./_generated/api";

const listActive = FunctionImpl.make(api, "species", "listActive", () =>
    Effect.gen(function* () {
        yield* requireAbility("read", "Species");
        return yield* SpeciesService.listForOrg();
    }).pipe(Effect.provide(ServicesLive)),
);

const create = FunctionImpl.make(
    api,
    "species",
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

const remove = FunctionImpl.make(api, "species", "remove", ({ id }) =>
    Effect.gen(function* () {
        yield* requireAbility("delete", "Species");
        yield* SpeciesService.removeForOrg(id);
        return null;
    }).pipe(Effect.provide(ServicesLive)),
);

const hideSystem = FunctionImpl.make(
    api,
    "species",
    "hideSystem",
    ({ id }) =>
        Effect.gen(function* () {
            yield* requireAbility("manage", "HiddenSpecies");
            yield* SpeciesService.hideSystemForOrg(id);
            return null;
        }).pipe(Effect.provide(ServicesLive)),
);

const unhideSystem = FunctionImpl.make(
    api,
    "species",
    "unhideSystem",
    ({ id }) =>
        Effect.gen(function* () {
            yield* requireAbility("manage", "HiddenSpecies");
            yield* SpeciesService.unhideSystemForOrg(id);
            return null;
        }).pipe(Effect.provide(ServicesLive)),
);

const seedDefaults = FunctionImpl.make(api, "species", "seedDefaults", () =>
    SpeciesService.seedDefaults().pipe(Effect.provide(ServicesLive)),
);

export const species = GroupImpl.make(api, "species").pipe(
    Layer.provide(listActive),
    Layer.provide(create),
    Layer.provide(remove),
    Layer.provide(hideSystem),
    Layer.provide(unhideSystem),
    Layer.provide(seedDefaults),
);
