import { FunctionImpl, GroupImpl } from "@confect/server";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

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
import databaseSchema from "./_generated/schema";
import trees from "./trees.spec";

const listByLocation = FunctionImpl.make(
    databaseSchema,
    trees,
    "listByLocation",
    ({ locationId }) =>
        Effect.gen(function* () {
            yield* requireAbility("read", "Tree");
            yield* LocationService.getById(locationId);
            const treeList = yield* TreeService.listByLocation(locationId);
            const speciesById = yield* SpeciesService.loadByIds(
                treeList.map((t) => t.speciesId),
            );
            return { trees: treeList, speciesById };
        }).pipe(Effect.provide(ServicesLive)),
);

const get = FunctionImpl.make(databaseSchema, trees, "get", ({ id }) =>
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

const create = FunctionImpl.make(databaseSchema, trees, "create", (args) =>
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

const update = FunctionImpl.make(
    databaseSchema,
    trees,
    "update",
    ({ id, ...data }) =>
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

const remove = FunctionImpl.make(databaseSchema, trees, "remove", ({ id }) =>
    Effect.gen(function* () {
        yield* requireAbility("delete", "Tree");
        yield* TreeService.remove(id);
        return null;
    }).pipe(Effect.provide(ServicesLive)),
);

const recomputeNextControlDates = FunctionImpl.make(
    databaseSchema,
    trees,
    "recomputeNextControlDates",
    () =>
        Effect.gen(function* () {
            const allTrees = yield* TreeService.streamAll();
            const now = Date.now();

            yield* Effect.forEach(
                allTrees,
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

export default GroupImpl.make(databaseSchema, trees).pipe(
    Layer.provide(listByLocation),
    Layer.provide(get),
    Layer.provide(create),
    Layer.provide(update),
    Layer.provide(remove),
    Layer.provide(recomputeNextControlDates),
    GroupImpl.finalize,
);
