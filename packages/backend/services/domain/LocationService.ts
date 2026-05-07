import { Effect, Layer } from "effect";

import type { LatLng, OrgId } from "@cataster/validators";
import { ConflictError, NotFoundError } from "@cataster/validators";

import type { LocationDoc, LocationId } from "../../types";
import {
    Auth,
    DatabaseReader,
    DatabaseWriter,
} from "../../confect/_generated/services";
import { requireUser } from "../../lib/auth/requireUser";
import { LocationRepository } from "../data/LocationRepository";
import { TreeRepository } from "../data/TreeRepository";
import { isPointInLocationPolygon } from "../geospatial/GSLib";

export type { LocationDoc, LocationId };

type CreateInput = {
    readonly name: string;
    readonly osmId: number;
    readonly osmType: string;
    readonly polygon: ReadonlyArray<ReadonlyArray<LatLng>>;
    readonly centroid: LatLng;
};

export class LocationService extends Effect.Tag(
    "@cataster/services/LocationService",
)<
    LocationService,
    {
        readonly list: () => Effect.Effect<
            ReadonlyArray<LocationDoc>,
            never,
            DatabaseReader | Auth
        >;
        readonly getById: (
            id: LocationId,
        ) => Effect.Effect<LocationDoc, NotFoundError, DatabaseReader | Auth>;
        readonly assertContainsPoint: (
            id: LocationId,
            point: LatLng,
        ) => Effect.Effect<
            void,
            NotFoundError | ConflictError,
            DatabaseReader | Auth
        >;
        readonly create: (
            input: CreateInput,
        ) => Effect.Effect<LocationId, never, DatabaseWriter | Auth>;
        readonly rename: (
            id: LocationId,
            name: string,
        ) => Effect.Effect<
            void,
            NotFoundError,
            DatabaseReader | DatabaseWriter | Auth
        >;
        readonly remove: (
            id: LocationId,
        ) => Effect.Effect<
            void,
            NotFoundError,
            DatabaseReader | DatabaseWriter | Auth
        >;
    }
>() {}

export const LocationServiceLive = Layer.sync(LocationService, () => {
    const resolveById = (id: LocationId, orgId: OrgId) =>
        Effect.gen(function* () {
            const doc = yield* LocationRepository.getById(id);
            if (doc === null || doc.orgId !== orgId) {
                return yield* Effect.fail(
                    new NotFoundError({ message: "Standort nicht gefunden" }),
                );
            }
            return doc;
        });

    const list: LocationService["Type"]["list"] = () =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            return yield* LocationRepository.listByOrg(orgId);
        });

    const getById: LocationService["Type"]["getById"] = (id) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            return yield* resolveById(id, orgId);
        });

    const assertContainsPoint: LocationService["Type"]["assertContainsPoint"] =
        (id, point) =>
            Effect.gen(function* () {
                const { orgId } = yield* Effect.orDie(requireUser);
                const location = yield* resolveById(id, orgId);
                if (!isPointInLocationPolygon(point, location.polygon)) {
                    return yield* Effect.fail(
                        new ConflictError({
                            message:
                                "Baum liegt außerhalb des Standort-Polygons",
                        }),
                    );
                }
            });

    const create: LocationService["Type"]["create"] = (input) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            return yield* LocationRepository.insert({
                orgId,
                name: input.name,
                osmId: input.osmId,
                osmType: input.osmType,
                polygon: input.polygon,
                centroid: input.centroid,
                updatedAt: Date.now(),
            });
        });

    const rename: LocationService["Type"]["rename"] = (id, name) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            yield* resolveById(id, orgId);
            yield* LocationRepository.patch(id, {
                name,
                updatedAt: Date.now(),
            });
        });

    const remove: LocationService["Type"]["remove"] = (id) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            yield* resolveById(id, orgId);

            const trees = yield* TreeRepository.listByOrgAndLocation(orgId, id);
            yield* Effect.forEach(
                trees,
                (tree) => TreeRepository.remove(tree._id),
                { discard: true },
            );

            yield* LocationRepository.remove(id);
        });

    return { list, getById, assertContainsPoint, create, rename, remove };
});
