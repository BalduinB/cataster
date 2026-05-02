import { describe, it } from "@effect/vitest";
import { assertEquals, assertTrue } from "@effect/vitest/utils";
import { Effect } from "effect";

import {
    computeNextControlAt,
    normalizeOptionalString,
    validateMeasurement,
    validateTreeMeasurements,
    validateVitality,
} from "../services/domain/treeScheduling";

describe("treeScheduling", () => {
    describe("normalizeOptionalString", () => {
        it.effect("returns null for null input", () =>
            Effect.gen(function* () {
                assertEquals(normalizeOptionalString(null), null);
            }),
        );

        it.effect("returns null for empty string", () =>
            Effect.gen(function* () {
                assertEquals(normalizeOptionalString(""), null);
            }),
        );

        it.effect("returns null for whitespace-only string", () =>
            Effect.gen(function* () {
                assertEquals(normalizeOptionalString("   "), null);
            }),
        );

        it.effect("trims and returns non-empty string", () =>
            Effect.gen(function* () {
                assertEquals(normalizeOptionalString("  hello  "), "hello");
            }),
        );
    });

    describe("validateVitality", () => {
        it.effect("accepts valid vitality values (0-4)", () =>
            Effect.gen(function* () {
                for (const v of [0, 1, 2, 3, 4]) {
                    yield* validateVitality(v);
                }
            }),
        );

        it.effect("rejects negative vitality", () =>
            Effect.gen(function* () {
                const result = yield* validateVitality(-1).pipe(
                    Effect.as("ok"),
                    Effect.catchTag("Conflict", () => Effect.succeed("fail")),
                );
                assertEquals(result, "fail");
            }),
        );

        it.effect("rejects vitality above 4", () =>
            Effect.gen(function* () {
                const result = yield* validateVitality(5).pipe(
                    Effect.as("ok"),
                    Effect.catchTag("Conflict", () => Effect.succeed("fail")),
                );
                assertEquals(result, "fail");
            }),
        );
    });

    describe("validateMeasurement", () => {
        it.effect("accepts positive values", () =>
            Effect.gen(function* () {
                yield* validateMeasurement("Height", 5);
            }),
        );

        it.effect("rejects zero by default", () =>
            Effect.gen(function* () {
                const result = yield* validateMeasurement("Height", 0).pipe(
                    Effect.as("ok"),
                    Effect.catchTag("Conflict", () => Effect.succeed("fail")),
                );
                assertEquals(result, "fail");
            }),
        );

        it.effect("accepts zero when allowZero is true", () =>
            Effect.gen(function* () {
                yield* validateMeasurement("Crown", 0, { allowZero: true });
            }),
        );
    });

    describe("validateTreeMeasurements", () => {
        it.effect("accepts valid measurements", () =>
            Effect.gen(function* () {
                yield* validateTreeMeasurements({
                    circumference: 1.5,
                    height: 10,
                    crownDiameter: 5,
                    vitality: 2,
                });
            }),
        );

        it.effect("rejects invalid measurements", () =>
            Effect.gen(function* () {
                const result = yield* validateTreeMeasurements({
                    circumference: -1,
                    height: 10,
                    crownDiameter: 5,
                    vitality: 2,
                }).pipe(
                    Effect.as("ok"),
                    Effect.catchTag("Conflict", () => Effect.succeed("fail")),
                );
                assertEquals(result, "fail");
            }),
        );
    });

    describe("computeNextControlAt", () => {
        it.effect("returns null when no control interval and no additional date", () =>
            Effect.gen(function* () {
                const result = yield* computeNextControlAt({
                    controlIntervalRRule: null,
                    additionalControlAt: null,
                    baseDate: Date.now(),
                });
                assertEquals(result, null);
            }),
        );

        it.effect("returns additional control date when it is in the future", () =>
            Effect.gen(function* () {
                const future = Date.now() + 86400000;
                const result = yield* computeNextControlAt({
                    controlIntervalRRule: null,
                    additionalControlAt: future,
                    baseDate: Date.now(),
                    now: Date.now(),
                });
                assertEquals(result, future);
            }),
        );

        it.effect("ignores additional control date in the past", () =>
            Effect.gen(function* () {
                const past = Date.now() - 86400000;
                const result = yield* computeNextControlAt({
                    controlIntervalRRule: null,
                    additionalControlAt: past,
                    baseDate: Date.now(),
                    now: Date.now(),
                });
                assertEquals(result, null);
            }),
        );

        it.effect("computes next occurrence from RRULE", () =>
            Effect.gen(function* () {
                const baseDate = Date.now() - 86400000 * 365;
                const result = yield* computeNextControlAt({
                    controlIntervalRRule: "FREQ=YEARLY",
                    controlTimezone: "Europe/Berlin",
                    additionalControlAt: null,
                    baseDate,
                    now: Date.now(),
                });
                assertTrue(result !== null && result >= Date.now());
            }),
        );
    });
});
