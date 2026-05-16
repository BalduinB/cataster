import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import { subject } from "@cataster/abilities";
import { canReadLocation } from "@cataster/abilities/domains/location";

import { LocationService, requireAbility, ServicesLive } from "../services";
import api from "./_generated/api";

const list = FunctionImpl.make(api, "locations", "list", () =>
    Effect.gen(function* () {
        const user = yield* requireAbility("read", "Location");
        const locations = yield* LocationService.list();
        return yield* Effect.filter(locations, (location) =>
            Effect.succeed(canReadLocation(user, location)),
        );
    }).pipe(Effect.provide(ServicesLive)),
);

const get = FunctionImpl.make(api, "locations", "get", ({ id }) =>
    Effect.gen(function* () {
        yield* requireAbility("read", "Location");
        return yield* LocationService.getById(id);
    }).pipe(Effect.provide(ServicesLive)),
);

const create = FunctionImpl.make(api, "locations", "create", (args) =>
    Effect.gen(function* () {
        yield* requireAbility("create", "Location");
        return yield* LocationService.create(args);
    }).pipe(Effect.provide(ServicesLive)),
);

const update = FunctionImpl.make(api, "locations", "update", ({ id, name }) =>
    Effect.gen(function* () {
        const location = yield* LocationService.getById(id);
        yield* requireAbility("update", subject("Location", location));
        yield* LocationService.rename(id, name);
        return null;
    }).pipe(Effect.provide(ServicesLive)),
);

const remove = FunctionImpl.make(api, "locations", "remove", ({ id }) =>
    Effect.gen(function* () {
        const location = yield* LocationService.getById(id);
        yield* requireAbility("delete", subject("Location", location));
        yield* LocationService.remove(id);
        return null;
    }).pipe(Effect.provide(ServicesLive)),
);

export const locations = GroupImpl.make(api, "locations").pipe(
    Layer.provide(list),
    Layer.provide(get),
    Layer.provide(create),
    Layer.provide(update),
    Layer.provide(remove),
);
