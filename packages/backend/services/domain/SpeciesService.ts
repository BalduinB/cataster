import { type GenericId } from "convex/values";
import { Effect, Layer, Record, Schema } from "effect";

import { ConflictError, NotFoundError } from "@cataster/validators";

import {
  DatabaseReader,
  DatabaseWriter,
} from "../../confect/_generated/services";
import {
  hiddenSpecies as hiddenSpeciesTable,
  species as speciesTable,
} from "../../confect/schema";
import { type OrgId } from "../auth/requireUser";
import { dieOnInternal } from "../internal";
import { DEFAULT_SPECIES } from "./defaultSpecies";

export type SpeciesDoc = Schema.Schema.Type<typeof speciesTable.Doc>;
export type HiddenSpeciesDoc = Schema.Schema.Type<typeof hiddenSpeciesTable.Doc>;
export type SpeciesId = GenericId<"species">;
export type HiddenSpeciesId = GenericId<"hiddenSpecies">;

type UpsertOrgInput = {
  readonly orgId: OrgId;
  readonly deName: string;
  readonly botanicalName: string;
  readonly sortOrder: number;
};

type UpsertSystemInput = {
  readonly deName: string;
  readonly botanicalName: string;
  readonly sortOrder: number;
};

/**
 * Domain service for the `species` aggregate. Hybrid catalog:
 *
 * - **System species** (`orgId === null`) are seeded from `DEFAULT_SPECIES`
 *   and visible to every org. Only the `seedDefaults` codepath writes them.
 * - **Org species** (`orgId === user.orgId`) are additions a single org has
 *   created; CRUD-able by org admins only (gated at the handler).
 * - **Hidden system species**: an org may hide individual system rows from
 *   its picker via the `hiddenSpecies` table; org-owned rows are deleted, not
 *   hidden.
 *
 * `listForOrg` returns the active, non-hidden union; `loadByIds` fetches by
 * id and asserts each row is either system or owned by `orgId` so a foreign
 * tree can never reference a foreign org's species.
 */
export class SpeciesService extends Effect.Tag(
  "@cataster/services/SpeciesService",
)<
  SpeciesService,
  {
    readonly listForOrg: (
      orgId: OrgId,
    ) => Effect.Effect<ReadonlyArray<SpeciesDoc>, never, DatabaseReader>;
    readonly getForOrg: (
      orgId: OrgId,
      id: SpeciesId,
    ) => Effect.Effect<SpeciesDoc, NotFoundError, DatabaseReader>;
    readonly loadByIds: (
      orgId: OrgId,
      ids: ReadonlyArray<SpeciesId>,
    ) => Effect.Effect<
      Readonly<Record<SpeciesId, SpeciesDoc>>,
      never,
      DatabaseReader
    >;
    readonly upsertForOrg: (
      input: UpsertOrgInput,
    ) => Effect.Effect<
      SpeciesId,
      ConflictError,
      DatabaseReader | DatabaseWriter
    >;
    readonly removeForOrg: (
      orgId: OrgId,
      id: SpeciesId,
    ) => Effect.Effect<
      void,
      NotFoundError | ConflictError,
      DatabaseReader | DatabaseWriter
    >;
    readonly hideSystemForOrg: (
      orgId: OrgId,
      id: SpeciesId,
    ) => Effect.Effect<
      HiddenSpeciesId,
      NotFoundError | ConflictError,
      DatabaseReader | DatabaseWriter
    >;
    readonly unhideSystemForOrg: (
      orgId: OrgId,
      id: SpeciesId,
    ) => Effect.Effect<void, never, DatabaseReader | DatabaseWriter>;
    readonly seedDefaults: () => Effect.Effect<
      ReadonlyArray<SpeciesId>,
      ConflictError,
      DatabaseReader | DatabaseWriter
    >;
  }
>() {}

export const SpeciesServiceLive = Layer.sync(SpeciesService, () => {
  const collectHiddenIds = (orgId: OrgId) =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      const rows = yield* dieOnInternal(
        db
          .table("hiddenSpecies")
          .index("by_orgId", (q) => q.eq("orgId", orgId))
          .collect(),
      );
      return new Set<SpeciesId>(rows.map((r) => r.speciesId));
    });

  const listForOrg: SpeciesService["Type"]["listForOrg"] = (orgId) =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      const hidden = yield* collectHiddenIds(orgId);

      const system = yield* dieOnInternal(
        db
          .table("species")
          .index("by_orgId_and_isActive_and_sortOrder", (q) =>
            q.eq("orgId", null).eq("isActive", true),
          )
          .collect(),
      );

      const ownOrg = yield* dieOnInternal(
        db
          .table("species")
          .index("by_orgId_and_isActive_and_sortOrder", (q) =>
            q.eq("orgId", orgId).eq("isActive", true),
          )
          .collect(),
      );

      const visibleSystem = system.filter((s) => !hidden.has(s._id));
      return [...visibleSystem, ...ownOrg];
    });

  const getForOrg: SpeciesService["Type"]["getForOrg"] = (orgId, id) =>
    Effect.gen(function* () {
      const db = yield* DatabaseReader;
      const doc = yield* db
        .table("species")
        .get(id)
        .pipe(
          Effect.catchTag("GetByIdFailure", () =>
            Effect.fail(
              new NotFoundError({ message: "Baumart nicht gefunden" }),
            ),
          ),
          dieOnInternal,
        );
      // Visible iff system OR owned by org.
      if (doc.orgId !== null && doc.orgId !== orgId) {
        return yield* Effect.fail(
          new NotFoundError({ message: "Baumart nicht gefunden" }),
        );
      }
      return doc;
    });

  const loadByIds: SpeciesService["Type"]["loadByIds"] = (orgId, ids) =>
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
        docs.filter(
          (entry): entry is readonly [SpeciesId, SpeciesDoc] =>
            entry !== null &&
            (entry[1].orgId === null || entry[1].orgId === orgId),
        ),
      );
    });

  /**
   * Shared upsert logic for both system (`orgId = null`) and per-org rows.
   * Identity within a tenancy is `(orgId, botanicalName)` — see the
   * `by_orgId_and_botanicalName` index.
   */
  const upsertScoped = (
    orgId: OrgId | null,
    { deName, botanicalName, sortOrder }: UpsertSystemInput,
  ) =>
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
        .get("by_orgId_and_botanicalName", orgId, trimmedBotanicalName)
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
          orgId,
          deName: trimmedDeName,
          botanicalName: trimmedBotanicalName,
          isActive: true,
          sortOrder,
          updatedAt,
        }),
      );
    });

  const upsertForOrg: SpeciesService["Type"]["upsertForOrg"] = (input) =>
    upsertScoped(input.orgId, {
      deName: input.deName,
      botanicalName: input.botanicalName,
      sortOrder: input.sortOrder,
    });

  const removeForOrg: SpeciesService["Type"]["removeForOrg"] = (orgId, id) =>
    Effect.gen(function* () {
      const doc = yield* getForOrg(orgId, id);
      if (doc.orgId === null) {
        return yield* Effect.fail(
          new ConflictError({
            message: "System-Baumarten können nicht gelöscht werden",
          }),
        );
      }
      const writer = yield* DatabaseWriter;
      yield* writer.table("species").delete(id);
    });

  const hideSystemForOrg: SpeciesService["Type"]["hideSystemForOrg"] = (
    orgId,
    id,
  ) =>
    Effect.gen(function* () {
      const doc = yield* getForOrg(orgId, id);
      if (doc.orgId !== null) {
        return yield* Effect.fail(
          new ConflictError({
            message: "Nur System-Baumarten können ausgeblendet werden",
          }),
        );
      }

      const reader = yield* DatabaseReader;
      const writer = yield* DatabaseWriter;

      const existing = yield* reader
        .table("hiddenSpecies")
        .get("by_orgId_and_speciesId", orgId, id)
        .pipe(
          Effect.catchTag("GetByIndexFailure", () => Effect.succeed(null)),
          dieOnInternal,
        );

      if (existing !== null) return existing._id;

      return yield* dieOnInternal(
        writer.table("hiddenSpecies").insert({ orgId, speciesId: id }),
      );
    });

  const unhideSystemForOrg: SpeciesService["Type"]["unhideSystemForOrg"] = (
    orgId,
    id,
  ) =>
    Effect.gen(function* () {
      const reader = yield* DatabaseReader;
      const writer = yield* DatabaseWriter;

      const existing = yield* reader
        .table("hiddenSpecies")
        .get("by_orgId_and_speciesId", orgId, id)
        .pipe(
          Effect.catchTag("GetByIndexFailure", () => Effect.succeed(null)),
          dieOnInternal,
        );

      if (existing !== null) {
        yield* writer.table("hiddenSpecies").delete(existing._id);
      }
    });

  /**
   * Idempotent: upserts every entry in `DEFAULT_SPECIES` as a system row
   * (`orgId = null`). Wired as a deploy-time init mutation; safe to re-run
   * on every deploy because the `(null, botanicalName)` index makes lookups
   * O(1) and patches are a no-op when nothing changed.
   *
   * Removing a species from `DEFAULT_SPECIES` does not auto-delete the
   * existing row — system catalog deletions are an explicit operation.
   */
  const seedDefaults: SpeciesService["Type"]["seedDefaults"] = () =>
    Effect.gen(function* () {
      const ids: Array<SpeciesId> = [];
      for (const [sortOrder, sp] of DEFAULT_SPECIES.entries()) {
        const id = yield* upsertScoped(null, {
          deName: sp.deName,
          botanicalName: sp.botanicalName,
          sortOrder,
        });
        ids.push(id);
      }
      return ids;
    });

  return {
    listForOrg,
    getForOrg,
    loadByIds,
    upsertForOrg,
    removeForOrg,
    hideSystemForOrg,
    unhideSystemForOrg,
    seedDefaults,
  };
});
