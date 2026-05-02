import { differenceInDays } from "date-fns";
import { Array, Effect, Layer, Order } from "effect";

import { ConflictError, NotFoundError } from "@cataster/validators";

import type { LocationId, TreeDoc, TreeId } from "../../types";
import {
    Auth,
    DatabaseReader,
    DatabaseWriter,
    MutationCtx,
} from "../../confect/_generated/services";
import { requireUser } from "../auth/requireUser";
import { TreeRepository } from "../data/TreeRepository";
import { GeospatialService } from "../geospatial/GeospatialService";
import {
    computeNextControlAt,
    DEFAULT_CONTROL_TIMEZONE,
    normalizeOptionalString,
    validateControlIntervalRRule,
    validateTreeMeasurements,
} from "./treeScheduling";

export type { LocationId, TreeDoc, TreeId };

type CreateInput = {
    readonly locationId: LocationId;
    readonly speciesId: string;
    readonly plateNumber: string | null;
    readonly circumference: number;
    readonly height: number;
    readonly crownDiameter: number;
    readonly vitality: number;
    readonly notes: string | null;
    readonly controlIntervalRRule: string | null;
    readonly controlTimezone: string | null;
    readonly additionalControlAt: number | null;
    readonly latitude: number;
    readonly longitude: number;
};

type UpdateInput = {
    readonly id: TreeId;
    readonly speciesId?: string;
    readonly plateNumber?: string | null;
    readonly circumference?: number;
    readonly height?: number;
    readonly crownDiameter?: number;
    readonly vitality?: number;
    readonly notes?: string | null;
    readonly controlIntervalRRule?: string | null;
    readonly controlTimezone?: string | null;
    readonly additionalControlAt?: number | null;
    readonly latitude?: number;
    readonly longitude?: number;
};

export class TreeService extends Effect.Tag("@cataster/services/TreeService")<
    TreeService,
    {
        readonly getById: (
            id: TreeId,
        ) => Effect.Effect<
            TreeDoc | null,
            never,
            DatabaseReader | Auth
        >;
        readonly listByLocation: (
            locationId: LocationId,
        ) => Effect.Effect<
            ReadonlyArray<TreeDoc>,
            never,
            DatabaseReader | Auth
        >;
        readonly assertPlateNumberUnique: (
            locationId: LocationId,
            plateNumber: string | null,
            currentTreeId?: TreeId,
        ) => Effect.Effect<void, ConflictError, DatabaseReader | Auth>;
        readonly create: (
            input: CreateInput,
        ) => Effect.Effect<
            TreeId,
            NotFoundError | ConflictError,
            | DatabaseReader
            | DatabaseWriter
            | Auth
            | GeospatialService
            | MutationCtx
        >;
        readonly update: (
            input: UpdateInput,
        ) => Effect.Effect<
            void,
            NotFoundError | ConflictError,
            | DatabaseReader
            | DatabaseWriter
            | Auth
            | GeospatialService
            | MutationCtx
        >;
        readonly remove: (
            id: TreeId,
        ) => Effect.Effect<
            void,
            NotFoundError,
            | DatabaseReader
            | DatabaseWriter
            | Auth
            | GeospatialService
            | MutationCtx
        >;
        readonly streamAll: () => Effect.Effect<
            ReadonlyArray<TreeDoc>,
            never,
            DatabaseReader
        >;
    }
>() {}

export const TreeServiceLive = Layer.sync(TreeService, () => {
    const getById: TreeService["Type"]["getById"] = (id) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            const doc = yield* TreeRepository.getById(id);
            if (doc === null || doc.orgId !== orgId) return null;
            return doc;
        });

    const listByLocation: TreeService["Type"]["listByLocation"] = (
        locationId,
    ) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            const trees = yield* TreeRepository.listByOrgAndLocation(
                orgId,
                locationId,
            );
            return Array.sortWith(
                trees,
                (tree) =>
                    !tree.nextControlAt
                        ? Infinity
                        : differenceInDays(tree.nextControlAt, new Date()),
                Order.number,
            );
        });

    const assertPlateNumberUnique: TreeService["Type"]["assertPlateNumberUnique"] =
        (locationId, plateNumber, currentTreeId) =>
            Effect.gen(function* () {
                if (!plateNumber) return;
                const { orgId } = yield* Effect.orDie(requireUser);
                const existing = yield* TreeRepository.findByPlateNumber(
                    orgId,
                    locationId,
                    plateNumber,
                );
                if (
                    existing._tag === "Some" &&
                    existing.value._id !== currentTreeId
                ) {
                    return yield* Effect.fail(
                        new ConflictError({
                            message:
                                "Plakettennummer ist in diesem Standort bereits vergeben",
                        }),
                    );
                }
            });

    const create: TreeService["Type"]["create"] = (input) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);

            yield* validateTreeMeasurements(input);

            const plateNumber = normalizeOptionalString(input.plateNumber);
            const notes = normalizeOptionalString(input.notes);
            const controlTimezone =
                normalizeOptionalString(input.controlTimezone) ??
                DEFAULT_CONTROL_TIMEZONE;
            const controlIntervalRRule = yield* validateControlIntervalRRule({
                controlIntervalRRule: input.controlIntervalRRule,
                controlTimezone,
                baseDate: Date.now(),
            });

            yield* assertPlateNumberUnique(
                input.locationId,
                plateNumber,
            );

            const nextControlAt = yield* computeNextControlAt({
                controlIntervalRRule,
                controlTimezone,
                additionalControlAt: input.additionalControlAt,
                baseDate: Date.now(),
            });

            const treeId = yield* TreeRepository.insert({
                orgId,
                locationId: input.locationId,
                plateNumber,
                speciesId: input.speciesId as never,
                circumference: input.circumference,
                height: input.height,
                crownDiameter: input.crownDiameter,
                vitality: input.vitality,
                notes,
                controlIntervalRRule,
                controlTimezone,
                additionalControlAt: input.additionalControlAt,
                nextControlAt,
                latitude: input.latitude,
                longitude: input.longitude,
                updatedAt: Date.now(),
            });

            yield* GeospatialService.insert(treeId, {
                latitude: input.latitude,
                longitude: input.longitude,
            });

            return treeId;
        });

    const update: TreeService["Type"]["update"] = ({ id, ...data }) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);

            const existing = yield* TreeRepository.getById(id);
            if (existing === null || existing.orgId !== orgId) {
                return yield* Effect.fail(
                    new NotFoundError({ message: "Baum nicht gefunden" }),
                );
            }

            const speciesId = data.speciesId ?? existing.speciesId;
            const plateNumber =
                data.plateNumber !== undefined
                    ? normalizeOptionalString(data.plateNumber)
                    : existing.plateNumber;
            const circumference = data.circumference ?? existing.circumference;
            const height = data.height ?? existing.height;
            const crownDiameter = data.crownDiameter ?? existing.crownDiameter;
            const vitality = data.vitality ?? existing.vitality;
            const notes =
                data.notes !== null
                    ? normalizeOptionalString(data.notes ?? null)
                    : existing.notes;
            const controlTimezone =
                normalizeOptionalString(data.controlTimezone ?? null) ??
                existing.controlTimezone ??
                DEFAULT_CONTROL_TIMEZONE;
            const controlIntervalRRule =
                data.controlIntervalRRule !== undefined
                    ? yield* validateControlIntervalRRule({
                          controlIntervalRRule: data.controlIntervalRRule,
                          controlTimezone,
                          baseDate: existing._creationTime,
                      })
                    : existing.controlIntervalRRule;
            const additionalControlAt =
                data.additionalControlAt !== undefined
                    ? data.additionalControlAt
                    : existing.additionalControlAt;
            const latitude = data.latitude ?? existing.latitude;
            const longitude = data.longitude ?? existing.longitude;

            yield* assertPlateNumberUnique(
                existing.locationId,
                plateNumber,
                existing._id,
            );
            yield* validateTreeMeasurements({
                circumference,
                height,
                crownDiameter,
                vitality,
            });

            const positionChanged =
                data.latitude !== undefined || data.longitude !== undefined;

            const nextControlAt = yield* computeNextControlAt({
                controlIntervalRRule,
                controlTimezone,
                additionalControlAt,
                baseDate: existing._creationTime,
            });

            yield* TreeRepository.patch(id, {
                plateNumber,
                speciesId: speciesId as never,
                circumference,
                height,
                crownDiameter,
                vitality,
                notes,
                controlIntervalRRule,
                controlTimezone,
                additionalControlAt,
                nextControlAt,
                latitude,
                longitude,
                updatedAt: Date.now(),
            });

            if (positionChanged) {
                yield* GeospatialService.move(id, { latitude, longitude });
            }
        });

    const remove: TreeService["Type"]["remove"] = (id) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            const existing = yield* TreeRepository.getById(id);
            if (existing === null || existing.orgId !== orgId) {
                return yield* Effect.fail(
                    new NotFoundError({ message: "Baum nicht gefunden" }),
                );
            }

            yield* GeospatialService.remove(id);
            yield* TreeRepository.remove(id);
        });

    const streamAll: TreeService["Type"]["streamAll"] = () =>
        TreeRepository.listAll();

    return {
        getById,
        listByLocation,
        assertPlateNumberUnique,
        create,
        update,
        remove,
        streamAll,
    };
});
