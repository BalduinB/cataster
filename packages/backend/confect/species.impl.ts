import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import { requireUser, ServicesLive, SpeciesService } from "../services";
import api from "./_generated/api";
import { surfaceErrors } from "./wire";

const listActive = FunctionImpl.make(api, "species", "listActive", () =>
  Effect.gen(function* () {
    yield* requireUser;
    return yield* SpeciesService.listActive();
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const create = FunctionImpl.make(
  api,
  "species",
  "create",
  ({ deName, botanicalName }) =>
    Effect.gen(function* () {
      yield* requireUser;
      const existing = yield* SpeciesService.listActive();
      return yield* SpeciesService.upsert({
        deName,
        botanicalName,
        sortOrder: existing.length,
      });
    }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const seedDefaults = FunctionImpl.make(api, "species", "seedDefaults", () =>
  SpeciesService.seedDefaults().pipe(
    Effect.provide(ServicesLive),
    surfaceErrors,
  ),
);

export const species = GroupImpl.make(api, "species").pipe(
  Layer.provide(listActive),
  Layer.provide(create),
  Layer.provide(seedDefaults),
);
