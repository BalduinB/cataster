import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import { subject } from "@cataster/abilities";
import { canReadLocation } from "@cataster/abilities/domains/location";

import { LocationService, requireAbility, ServicesLive } from "../services";
import api from "./_generated/api";
import { surfaceErrors } from "./wire";

const list = FunctionImpl.make(api, "locations", "list", () =>
    Effect.gen(function* () {
        const user = yield* requireAbility("read", "Location");
        const locations = yield* LocationService.list();
        return yield* Effect.filter(locations, (location) =>
            Effect.succeed(canReadLocation(user, location)),
        );
    }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const get = FunctionImpl.make(api, "locations", "get", ({ id }) =>
    Effect.gen(function* () {
        yield* requireAbility("read", "Location");
        return yield* LocationService.getById(id).pipe(
            Effect.catchTag("NotFound", () => Effect.succeed(null)),
        );
    }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const create = FunctionImpl.make(api, "locations", "create", (args) =>
    Effect.gen(function* () {
        yield* requireAbility("create", "Location");
        return yield* LocationService.create(args);
    }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const update = FunctionImpl.make(api, "locations", "update", ({ id, name }) =>
    Effect.gen(function* () {
        const location = yield* LocationService.getById(id);
        yield* requireAbility("update", subject("Location", location));
        yield* LocationService.rename(id, name);
        return null;
    }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const remove = FunctionImpl.make(api, "locations", "remove", ({ id }) =>
    Effect.gen(function* () {
        const location = yield* LocationService.getById(id);
        yield* requireAbility("delete", subject("Location", location));
        yield* LocationService.remove(id);
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
