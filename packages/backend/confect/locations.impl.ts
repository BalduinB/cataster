import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import { LocationService, requireAbility, ServicesLive } from "../services";
import api from "./_generated/api";
import { surfaceErrors } from "./wire";

const list = FunctionImpl.make(api, "locations", "list", () =>
  Effect.gen(function* () {
    const { orgId } = yield* requireAbility("read", "Location");
    return yield* LocationService.list(orgId);
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const get = FunctionImpl.make(api, "locations", "get", ({ id }) =>
  Effect.gen(function* () {
    const { orgId } = yield* requireAbility("read", "Location");
    return yield* LocationService.getById(orgId, id).pipe(
      Effect.catchTag("NotFound", () => Effect.succeed(null)),
    );
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const create = FunctionImpl.make(api, "locations", "create", (args) =>
  Effect.gen(function* () {
    const { orgId } = yield* requireAbility("create", "Location");
    return yield* LocationService.create({ ...args, orgId });
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const update = FunctionImpl.make(api, "locations", "update", ({ id, name }) =>
  Effect.gen(function* () {
    const { orgId } = yield* requireAbility("update", "Location");
    yield* LocationService.rename(orgId, id, name);
    return null;
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const remove = FunctionImpl.make(api, "locations", "remove", ({ id }) =>
  Effect.gen(function* () {
    const { orgId } = yield* requireAbility("delete", "Location");
    yield* LocationService.remove(orgId, id);
    return null;
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

export const locations = GroupImpl.make(api, "locations").pipe(
  Layer.provide(list),
  Layer.provide(get),
  Layer.provide(create),
  Layer.provide(update),
  Layer.provide(remove),
);
