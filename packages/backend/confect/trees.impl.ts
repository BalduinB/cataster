import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import { NotFoundError } from "@cataster/validators";

import {
    computeNextControlAt,
    LocationService,
    requireAbility,
    ServicesLive,
    SpeciesService,
    TreeRepository,
    TreeService,
} from "../services";
import api from "./_generated/api";

const listByLocation = FunctionImpl.make(
    api,
    "trees",
    "listByLocation",
    ({ locationId }) =>
        Effect.gen(function* () {
            yield* requireAbility("read", "Tree");
            yield* LocationService.getById(locationId);
            const trees = yield* TreeService.listByLocation(locationId);
            const speciesById = yield* SpeciesService.loadByIds(
                trees.map((t) => t.speciesId),
            );
            return { trees, speciesById };
        }).pipe(Effect.provide(ServicesLive)),
);

const get = FunctionImpl.make(api, "trees", "get", ({ id }) =>
    Effect.gen(function* () {
        yield* requireAbility("read", "Tree");
        const tree = yield* TreeService.getById(id);
        if (!tree) {
            return yield* Effect.fail(
                new NotFoundError({ message: "Baum nicht gefunden" }),
            );
        }
        return tree;
    }).pipe(Effect.provide(ServicesLive)),
);

const create = FunctionImpl.make(api, "trees", "create", (args) =>
    Effect.gen(function* () {
        yield* requireAbility("create", "Tree");
        yield* SpeciesService.getForOrg(args.speciesId);
        yield* LocationService.assertContainsPoint(args.locationId, {
            lat: args.latitude,
            lng: args.longitude,
        });
        return yield* TreeService.create(args);
    }).pipe(Effect.provide(ServicesLive)),
);

const update = FunctionImpl.make(api, "trees", "update", ({ id, ...data }) =>
    Effect.gen(function* () {
        yield* requireAbility("update", "Tree");
        if (data.speciesId) {
            yield* SpeciesService.getForOrg(data.speciesId);
        }
        if (data.latitude !== undefined || data.longitude !== undefined) {
            const existing = yield* TreeService.getById(id);
            if (existing) {
                const lat = data.latitude ?? existing.latitude;
                const lng = data.longitude ?? existing.longitude;
                yield* LocationService.assertContainsPoint(
                    existing.locationId,
                    { lat, lng },
                );
            }
        }
        yield* TreeService.update({ id, ...data });
        return null;
    }).pipe(Effect.provide(ServicesLive)),
);

const remove = FunctionImpl.make(api, "trees", "remove", ({ id }) =>
    Effect.gen(function* () {
        yield* requireAbility("delete", "Tree");
        yield* TreeService.remove(id);
        return null;
    }).pipe(Effect.provide(ServicesLive)),
);

const recomputeNextControlDates = FunctionImpl.make(
    api,
    "trees",
    "recomputeNextControlDates",
    () =>
        Effect.gen(function* () {
            const trees = yield* TreeService.streamAll();
            const now = Date.now();

            yield* Effect.forEach(
                trees,
                (tree) =>
                    Effect.gen(function* () {
                        const nextControlAt = yield* computeNextControlAt({
                            controlIntervalRRule: tree.controlIntervalRRule,
                            controlTimezone: tree.controlTimezone,
                            additionalControlAt: tree.additionalControlAt,
                            baseDate: tree._creationTime,
                            now,
                        });

                        if (nextControlAt !== tree.nextControlAt) {
                            yield* TreeRepository.patch(tree._id, {
                                nextControlAt,
                                updatedAt: Date.now(),
                            });
                        }
                    }),
                { discard: true },
            );

            return null;
        }).pipe(Effect.provide(ServicesLive)),
);

export const trees = GroupImpl.make(api, "trees").pipe(
    Layer.provide(listByLocation),
    Layer.provide(get),
    Layer.provide(create),
    Layer.provide(update),
    Layer.provide(remove),
    Layer.provide(recomputeNextControlDates),
);
