import { FunctionImpl, GroupImpl } from "@confect/server";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { subject } from "@cataster/abilities";
import { canReadLocation } from "@cataster/abilities/domains/location";

import { LocationService, requireAbility, ServicesLive } from "../services";
import databaseSchema from "./_generated/schema";
import locations from "./locations.spec";

const list = FunctionImpl.make(databaseSchema, locations, "list", () =>
    Effect.gen(function* () {
        const user = yield* requireAbility("read", "Location");
        const locationList = yield* LocationService.list();
        return yield* Effect.filter(locationList, (location) =>
            Effect.succeed(canReadLocation(user, location)),
        );
    }).pipe(Effect.provide(ServicesLive)),
);

const get = FunctionImpl.make(databaseSchema, locations, "get", ({ id }) =>
    Effect.gen(function* () {
        yield* requireAbility("read", "Location");
        const loc = yield* LocationService.getById(id);
        yield* requireAbility("read", subject("Location", loc));
        return loc;
    }).pipe(Effect.provide(ServicesLive)),
);

const create = FunctionImpl.make(databaseSchema, locations, "create", (args) =>
    Effect.gen(function* () {
        yield* requireAbility("create", "Location");
        return yield* LocationService.create(args);
    }).pipe(Effect.provide(ServicesLive)),
);

const update = FunctionImpl.make(
    databaseSchema,
    locations,
    "update",
    ({ id, name }) =>
        Effect.gen(function* () {
            const location = yield* LocationService.getById(id);
            yield* requireAbility("update", subject("Location", location));
            yield* LocationService.rename(id, name);
            return null;
        }).pipe(Effect.provide(ServicesLive)),
);

const remove = FunctionImpl.make(
    databaseSchema,
    locations,
    "remove",
    ({ id }) =>
        Effect.gen(function* () {
            const location = yield* LocationService.getById(id);
            yield* requireAbility("delete", subject("Location", location));
            yield* LocationService.remove(id);
            return null;
        }).pipe(Effect.provide(ServicesLive)),
);

export default GroupImpl.make(databaseSchema, locations).pipe(
    Layer.provide(list),
    Layer.provide(get),
    Layer.provide(create),
    Layer.provide(update),
    Layer.provide(remove),
    GroupImpl.finalize,
);
