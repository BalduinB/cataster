import { Effect, Layer, Record } from "effect";

import type { OrgId } from "@cataster/validators";
import { ConflictError, NotFoundError } from "@cataster/validators";

import type {
    HiddenSpeciesDoc,
    HiddenSpeciesId,
    SpeciesDoc,
    SpeciesId,
} from "../../types";
import {
    Auth,
    DatabaseReader,
    DatabaseWriter,
} from "../../confect/_generated/services";
import { requireUser } from "../../lib/auth/requireUser";
import { SpeciesRepository } from "../data/SpeciesRepository";
import { DEFAULT_SPECIES } from "./defaultSpecies";

export type { HiddenSpeciesDoc, HiddenSpeciesId, SpeciesDoc, SpeciesId };

type UpsertOrgInput = {
    readonly deName: string;
    readonly botanicalName: string;
    readonly sortOrder: number;
};

type UpsertSystemInput = {
    readonly deName: string;
    readonly botanicalName: string;
    readonly sortOrder: number;
};

export class SpeciesService extends Effect.Tag(
    "@cataster/services/SpeciesService",
)<
    SpeciesService,
    {
        readonly listForOrg: () => Effect.Effect<
            ReadonlyArray<SpeciesDoc>,
            never,
            DatabaseReader | Auth
        >;
        readonly getForOrg: (
            id: SpeciesId,
        ) => Effect.Effect<SpeciesDoc, NotFoundError, DatabaseReader | Auth>;
        readonly loadByIds: (
            ids: ReadonlyArray<SpeciesId>,
        ) => Effect.Effect<
            Readonly<globalThis.Record<SpeciesId, SpeciesDoc>>,
            never,
            DatabaseReader | Auth
        >;
        readonly upsertForOrg: (
            input: UpsertOrgInput,
        ) => Effect.Effect<
            SpeciesId,
            ConflictError,
            DatabaseReader | DatabaseWriter | Auth
        >;
        readonly removeForOrg: (
            id: SpeciesId,
        ) => Effect.Effect<
            void,
            NotFoundError | ConflictError,
            DatabaseReader | DatabaseWriter | Auth
        >;
        readonly hideSystemForOrg: (
            id: SpeciesId,
        ) => Effect.Effect<
            HiddenSpeciesId,
            NotFoundError | ConflictError,
            DatabaseReader | DatabaseWriter | Auth
        >;
        readonly unhideSystemForOrg: (
            id: SpeciesId,
        ) => Effect.Effect<void, never, DatabaseReader | DatabaseWriter | Auth>;
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
            const rows = yield* SpeciesRepository.listHiddenByOrg(orgId);
            return new Set<SpeciesId>(rows.map((r) => r.speciesId));
        });

    const resolveForOrg = (id: SpeciesId, orgId: OrgId) =>
        Effect.gen(function* () {
            const doc = yield* SpeciesRepository.getById(id);
            if (doc === null || (doc.orgId !== null && doc.orgId !== orgId)) {
                return yield* Effect.fail(
                    new NotFoundError({
                        message: "Baumart nicht gefunden",
                    }),
                );
            }
            return doc;
        });

    const upsertScoped = (
        orgId: OrgId | null,
        { deName, botanicalName, sortOrder }: UpsertSystemInput,
    ) =>
        Effect.gen(function* () {
            const trimmedDeName = deName.trim();
            const trimmedBotanicalName = botanicalName.trim();

            if (!trimmedDeName) {
                return yield* Effect.fail(
                    new ConflictError({
                        message: "German species name is required",
                    }),
                );
            }
            if (!trimmedBotanicalName) {
                return yield* Effect.fail(
                    new ConflictError({
                        message: "Botanical species name is required",
                    }),
                );
            }

            const updatedAt = Date.now();

            const existing = yield* SpeciesRepository.getByOrgAndBotanicalName(
                orgId,
                trimmedBotanicalName,
            );

            if (existing !== null) {
                yield* SpeciesRepository.patch(existing._id, {
                    deName: trimmedDeName,
                    isActive: true,
                    sortOrder,
                    updatedAt,
                });
                return existing._id;
            }

            return yield* SpeciesRepository.insert({
                orgId,
                deName: trimmedDeName,
                botanicalName: trimmedBotanicalName,
                isActive: true,
                sortOrder,
                updatedAt,
            });
        });

    const listForOrg: SpeciesService["Type"]["listForOrg"] = () =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            const hidden = yield* collectHiddenIds(orgId);

            const system = yield* SpeciesRepository.listActiveByOrg(null);
            const ownOrg = yield* SpeciesRepository.listActiveByOrg(orgId);

            const visibleSystem = system.filter((s) => !hidden.has(s._id));
            return [...visibleSystem, ...ownOrg];
        });

    const getForOrg: SpeciesService["Type"]["getForOrg"] = (id) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            return yield* resolveForOrg(id, orgId);
        });

    const loadByIds: SpeciesService["Type"]["loadByIds"] = (ids) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            const uniqueIds = Array.from(new Set(ids));

            const docs = yield* Effect.forEach(
                uniqueIds,
                (id) =>
                    SpeciesRepository.getById(id).pipe(
                        Effect.map((doc) => [id, doc] as const),
                    ),
                { concurrency: "unbounded" },
            );

            return Record.fromEntries(
                docs.filter(
                    (entry): entry is readonly [SpeciesId, SpeciesDoc] =>
                        entry[1] !== null &&
                        (entry[1].orgId === null || entry[1].orgId === orgId),
                ),
            );
        });

    const upsertForOrg: SpeciesService["Type"]["upsertForOrg"] = (input) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            return yield* upsertScoped(orgId, {
                deName: input.deName,
                botanicalName: input.botanicalName,
                sortOrder: input.sortOrder,
            });
        });

    const removeForOrg: SpeciesService["Type"]["removeForOrg"] = (id) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            const doc = yield* resolveForOrg(id, orgId);
            if (doc.orgId === null) {
                return yield* Effect.fail(
                    new ConflictError({
                        message:
                            "System-Baumarten können nicht gelöscht werden",
                    }),
                );
            }
            yield* SpeciesRepository.remove(id);
        });

    const hideSystemForOrg: SpeciesService["Type"]["hideSystemForOrg"] = (id) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            const doc = yield* resolveForOrg(id, orgId);
            if (doc.orgId !== null) {
                return yield* Effect.fail(
                    new ConflictError({
                        message:
                            "Nur System-Baumarten können ausgeblendet werden",
                    }),
                );
            }

            const existing = yield* SpeciesRepository.getHiddenByOrgAndSpecies(
                orgId,
                id,
            );
            if (existing !== null) return existing._id;

            return yield* SpeciesRepository.insertHidden({
                orgId,
                speciesId: id,
            });
        });

    const unhideSystemForOrg: SpeciesService["Type"]["unhideSystemForOrg"] = (
        id,
    ) =>
        Effect.gen(function* () {
            const { orgId } = yield* Effect.orDie(requireUser);
            const existing = yield* SpeciesRepository.getHiddenByOrgAndSpecies(
                orgId,
                id,
            );
            if (existing !== null) {
                yield* SpeciesRepository.removeHidden(existing._id);
            }
        });

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
