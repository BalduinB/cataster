import { ConflictError, NotFoundError } from "@cataster/validators";
import { type GenericId } from "convex/values";
import { Effect, Layer, Record, Schema } from "effect";

import {
  DatabaseReader,
  DatabaseWriter,
} from "../../confect/_generated/services";
import { species as speciesTable } from "../../confect/schema";
import { dieOnInternal } from "../internal";
import { DEFAULT_SPECIES } from "./defaultSpecies";

export type SpeciesDoc = Schema.Schema.Type<typeof speciesTable.Doc>;
export type SpeciesId = GenericId<"species">;

type UpsertInput = {
  readonly deName: string;
  readonly botanicalName: string;
  readonly sortOrder: number;
};

/**
 * Domain service for the `species` aggregate.
 *
 * All persistence operations go through Confect's `DatabaseReader` /
 * `DatabaseWriter` services so documents are decoded through the schema
 * pipeline. Methods that fail return shared `WireError`s so handlers can
 * `yield*` them straight through to `surfaceErrors`.
 */
export class SpeciesService extends Effect.Tag(
  "@cataster/services/SpeciesService",
)<
  SpeciesService,
  {
    readonly listActive: () => Effect.Effect<
      ReadonlyArray<SpeciesDoc>,
      never,
      DatabaseReader
    >;
    readonly getById: (
      id: SpeciesId,
    ) => Effect.Effect<SpeciesDoc, NotFoundError, DatabaseReader>;
    readonly loadByIds: (
      ids: ReadonlyArray<SpeciesId>,
    ) => Effect.Effect<
      Readonly<Record<SpeciesId, SpeciesDoc>>,
      never,
      DatabaseReader
    >;
    readonly upsert: (
      input: UpsertInput,
    ) => Effect.Effect<
      SpeciesId,
      ConflictError,
      DatabaseReader | DatabaseWriter
    >;
    readonly seedDefaults: () => Effect.Effect<
      ReadonlyArray<SpeciesId>,
      ConflictError,
      DatabaseReader | DatabaseWriter
    >;
  }
>() {}

export const SpeciesServiceLive = Layer.sync(SpeciesService, () => {
  const listActive: SpeciesService["Type"]["listActive"] = () =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      return yield* dieOnInternal(
        db
          .table("species")
          .index("by_isActive_and_sortOrder", (q) => q.eq("isActive", true))
          .collect(),
      );
    });

  const getById: SpeciesService["Type"]["getById"] = (id) =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      return yield* db
        .table("species")
        .get(id)
        .pipe(
          Effect.catchTag("GetByIdFailure", () =>
            Effect.fail(new NotFoundError({ message: "Baumart nicht gefunden" })),
          ),
          dieOnInternal,
        );
    });

  const loadByIds: SpeciesService["Type"]["loadByIds"] = (ids) =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      const uniqueIds = Array.from(new Set(ids));

      const docs = yield* Effect.forEach(
        uniqueIds,
        (id) =>
          db
            .table("species")
            .get(id)
            .pipe(
              Effect.map((doc) => [id, doc] as const),
              Effect.catchTag("GetByIdFailure", () => Effect.succeed(null)),
              dieOnInternal,
            ),
        { concurrency: "unbounded" },
      );

      return Record.fromEntries(
        docs.filter((entry): entry is readonly [SpeciesId, SpeciesDoc] =>
          entry !== null,
        ),
      );
    });

  const upsert: SpeciesService["Type"]["upsert"] = ({
    deName,
    botanicalName,
    sortOrder,
  }) =>
    Effect.gen(function* () {
      const trimmedDeName = deName.trim();
      const trimmedBotanicalName = botanicalName.trim();

      if (!trimmedDeName) {
        return yield* Effect.fail(
          new ConflictError({ message: "German species name is required" }),
        );
      }
      if (!trimmedBotanicalName) {
        return yield* Effect.fail(
          new ConflictError({ message: "Botanical species name is required" }),
        );
      }

      const reader = yield* DatabaseReader;
      const writer = yield* DatabaseWriter;
      const updatedAt = Date.now();

      const existing = yield* reader
        .table("species")
        .get("by_botanicalName", trimmedBotanicalName)
        .pipe(
          Effect.catchTag("GetByIndexFailure", () => Effect.succeed(null)),
          dieOnInternal,
        );

      if (existing !== null) {
        yield* dieOnInternal(
          writer.table("species").patch(existing._id, {
            deName: trimmedDeName,
            isActive: true,
            sortOrder,
            updatedAt,
          }),
        );
        return existing._id;
      }

      return yield* dieOnInternal(
        writer.table("species").insert({
          deName: trimmedDeName,
          botanicalName: trimmedBotanicalName,
          isActive: true,
          sortOrder,
          updatedAt,
        }),
      );
    });

  const seedDefaults: SpeciesService["Type"]["seedDefaults"] = () =>
    Effect.gen(function* () {
      const ids: Array<SpeciesId> = [];
      for (const [sortOrder, sp] of DEFAULT_SPECIES.entries()) {
        const id = yield* upsert({
          deName: sp.deName,
          botanicalName: sp.botanicalName,
          sortOrder,
        });
        ids.push(id);
      }
      return ids;
    });

  return { listActive, getById, loadByIds, upsert, seedDefaults };
});
