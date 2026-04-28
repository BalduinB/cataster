import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import { requireAbility, ServicesLive, SpeciesService } from "../services";
import api from "./_generated/api";
import { surfaceErrors } from "./wire";

const listActive = FunctionImpl.make(api, "species", "listActive", () =>
  Effect.gen(function* () {
    const { orgId } = yield* requireAbility("read", "Species");
    return yield* SpeciesService.listForOrg(orgId);
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const create = FunctionImpl.make(
  api,
  "species",
  "create",
  ({ deName, botanicalName }) =>
    Effect.gen(function* () {
      const { orgId } = yield* requireAbility("create", "Species");
      const existing = yield* SpeciesService.listForOrg(orgId);
      return yield* SpeciesService.upsertForOrg({
        orgId,
        deName,
        botanicalName,
        sortOrder: existing.length,
      });
    }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const remove = FunctionImpl.make(api, "species", "remove", ({ id }) =>
  Effect.gen(function* () {
    const { orgId } = yield* requireAbility("delete", "Species");
    yield* SpeciesService.removeForOrg(orgId, id);
    return null;
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const hideSystem = FunctionImpl.make(api, "species", "hideSystem", ({ id }) =>
  Effect.gen(function* () {
    const { orgId } = yield* requireAbility("manage", "HiddenSpecies");
    yield* SpeciesService.hideSystemForOrg(orgId, id);
    return null;
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const unhideSystem = FunctionImpl.make(
  api,
  "species",
  "unhideSystem",
  ({ id }) =>
    Effect.gen(function* () {
      const { orgId } = yield* requireAbility("manage", "HiddenSpecies");
      yield* SpeciesService.unhideSystemForOrg(orgId, id);
      return null;
    }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

/**
 * Internal: seeds system species. Caller is the deploy-time init cron — see
 * `confect/crons.ts`. Not gated by `requireUser` because it runs as a system
 * mutation; the spec marks it `internalMutation` so the client API surface
 * never exposes it.
 */
const seedDefaults = FunctionImpl.make(api, "species", "seedDefaults", () =>
  SpeciesService.seedDefaults().pipe(
    Effect.provide(ServicesLive),
    surfaceErrors,
  ),
);

export const species = GroupImpl.make(api, "species").pipe(
  Layer.provide(listActive),
  Layer.provide(create),
  Layer.provide(remove),
  Layer.provide(hideSystem),
  Layer.provide(unhideSystem),
  Layer.provide(seedDefaults),
);
