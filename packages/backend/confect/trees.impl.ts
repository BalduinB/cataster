import { NotFoundError } from "@cataster/validators";
import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import {
  computeNextControlAt,
  DEFAULT_CONTROL_TIMEZONE,
  dieOnInternal,
  GeospatialService,
  LocationService,
  normalizeOptionalString,
  requireUser,
  ServicesLive,
  SpeciesService,
  TreeService,
  validateControlIntervalRRule,
  validateTreeMeasurements,
} from "../services";
import api from "./_generated/api";
import { DatabaseReader, DatabaseWriter } from "./_generated/services";
import { surfaceErrors } from "./wire";

const listByLocation = FunctionImpl.make(
  api,
  "trees",
  "listByLocation",
  ({ locationId }) =>
    Effect.gen(function* () {
      yield* requireUser;
      const trees = yield* TreeService.listByLocation(locationId);
      const speciesById = yield* SpeciesService.loadByIds(
        trees.map((t) => t.speciesId),
      );
      return { trees, speciesById };
    }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const get = FunctionImpl.make(api, "trees", "get", ({ id }) =>
  Effect.gen(function* () {
    yield* requireUser;
    const db = yield* DatabaseReader;
    return yield* db
      .table("trees")
      .get(id)
      .pipe(
        Effect.catchTag("GetByIdFailure", () => Effect.succeed(null)),
        dieOnInternal,
      );
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const create = FunctionImpl.make(api, "trees", "create", (args) =>
  Effect.gen(function* () {
    yield* requireUser;
    const db = yield* DatabaseWriter;

    yield* SpeciesService.getById(args.speciesId);
    yield* validateTreeMeasurements(args);

    const plateNumber = normalizeOptionalString(args.plateNumber);
    const notes = normalizeOptionalString(args.notes);
    const controlTimezone =
      normalizeOptionalString(args.controlTimezone) ?? DEFAULT_CONTROL_TIMEZONE;
    const controlIntervalRRule = yield* validateControlIntervalRRule({
      controlIntervalRRule: args.controlIntervalRRule,
      controlTimezone,
      baseDate: Date.now(),
    });

    yield* TreeService.assertPlateNumberUnique(args.locationId, plateNumber);
    yield* LocationService.assertContainsPoint(args.locationId, {
      lat: args.latitude,
      lng: args.longitude,
    });

    const nextControlAt = yield* computeNextControlAt({
      controlIntervalRRule,
      controlTimezone,
      additionalControlAt: args.additionalControlAt,
      baseDate: Date.now(),
    });

    const treeId = yield* dieOnInternal(
      db.table("trees").insert({
        locationId: args.locationId,
        plateNumber,
        speciesId: args.speciesId,
        circumference: args.circumference,
        height: args.height,
        crownDiameter: args.crownDiameter,
        vitality: args.vitality,
        notes,
        controlIntervalRRule,
        controlTimezone,
        additionalControlAt: args.additionalControlAt,
        nextControlAt,
        latitude: args.latitude,
        longitude: args.longitude,
        updatedAt: Date.now(),
      }),
    );

    yield* GeospatialService.insert(treeId, {
      latitude: args.latitude,
      longitude: args.longitude,
    });

    return treeId;
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const update = FunctionImpl.make(api, "trees", "update", ({ id, ...data }) =>
  Effect.gen(function* () {
    yield* requireUser;
    const reader = yield* DatabaseReader;
    const writer = yield* DatabaseWriter;

    const existing = yield* reader
      .table("trees")
      .get(id)
      .pipe(
        Effect.catchTag("GetByIdFailure", () =>
          Effect.fail(new NotFoundError({ message: "Baum nicht gefunden" })),
        ),
        dieOnInternal,
      );

    const speciesId = data.speciesId ?? existing.speciesId;
    const plateNumber =
      data.plateNumber !== undefined
        ? normalizeOptionalString(data.plateNumber ?? undefined)
        : existing.plateNumber;
    const circumference = data.circumference ?? existing.circumference;
    const height = data.height ?? existing.height;
    const crownDiameter = data.crownDiameter ?? existing.crownDiameter;
    const vitality = data.vitality ?? existing.vitality;
    const notes =
      data.notes !== undefined
        ? normalizeOptionalString(data.notes ?? undefined)
        : existing.notes;
    const controlTimezone =
      normalizeOptionalString(data.controlTimezone) ??
      existing.controlTimezone ??
      DEFAULT_CONTROL_TIMEZONE;
    const controlIntervalRRule =
      data.controlIntervalRRule !== undefined
        ? yield* validateControlIntervalRRule({
            controlIntervalRRule: data.controlIntervalRRule ?? undefined,
            controlTimezone,
            baseDate: existing._creationTime,
          })
        : existing.controlIntervalRRule;
    const additionalControlAt =
      data.additionalControlAt !== undefined
        ? (data.additionalControlAt ?? undefined)
        : existing.additionalControlAt;
    const latitude = data.latitude ?? existing.latitude;
    const longitude = data.longitude ?? existing.longitude;

    yield* SpeciesService.getById(speciesId);
    yield* TreeService.assertPlateNumberUnique(
      existing.locationId,
      plateNumber,
      existing._id,
    );
    yield* validateTreeMeasurements({ circumference, height, crownDiameter, vitality });

    const positionChanged =
      data.latitude !== undefined || data.longitude !== undefined;
    if (positionChanged) {
      yield* LocationService.assertContainsPoint(existing.locationId, {
        lat: latitude,
        lng: longitude,
      });
    }

    const nextControlAt = yield* computeNextControlAt({
      controlIntervalRRule,
      controlTimezone,
      additionalControlAt,
      baseDate: existing._creationTime,
    });

    yield* dieOnInternal(
      writer.table("trees").patch(id, {
        plateNumber,
        speciesId,
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
      }),
    );

    if (positionChanged) {
      yield* GeospatialService.move(id, { latitude, longitude });
    }

    return null;
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const remove = FunctionImpl.make(api, "trees", "remove", ({ id }) =>
  Effect.gen(function* () {
    yield* requireUser;
    const writer = yield* DatabaseWriter;

    yield* GeospatialService.remove(id);
    yield* writer.table("trees").delete(id);

    return null;
  }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

const recomputeNextControlDates = FunctionImpl.make(
  api,
  "trees",
  "recomputeNextControlDates",
  () =>
    Effect.gen(function* () {
      const writer = yield* DatabaseWriter;
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
            }).pipe(
              // RRules that are persisted in DB are assumed valid; if one
              // ever isn't, surface as a defect rather than fail the whole
              // cron run on a single bad row.
              Effect.catchTag("Conflict", (e) => Effect.die(e)),
            );

            if (nextControlAt !== tree.nextControlAt) {
              yield* dieOnInternal(
                writer.table("trees").patch(tree._id, {
                  nextControlAt,
                  updatedAt: Date.now(),
                }),
              );
            }
          }),
        { discard: true },
      );

      return null;
    }).pipe(Effect.provide(ServicesLive), surfaceErrors),
);

export const trees = GroupImpl.make(api, "trees").pipe(
  Layer.provide(listByLocation),
  Layer.provide(get),
  Layer.provide(create),
  Layer.provide(update),
  Layer.provide(remove),
  Layer.provide(recomputeNextControlDates),
);
