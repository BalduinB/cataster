import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Effect } from "effect";

import { isPointInLocationPolygon } from "../services/geospatial/GSLib";

const squarePolygon = [
    [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 1 },
        { lat: 1, lng: 1 },
        { lat: 1, lng: 0 },
    ],
];

describe("isPointInLocationPolygon", () => {
    it.effect("returns true for point inside polygon", () =>
        Effect.gen(function* () {
            const result = isPointInLocationPolygon(
                { lat: 0.5, lng: 0.5 },
                squarePolygon,
            );
            assertEquals(result, true);
        }),
    );

    it.effect("returns false for point outside polygon", () =>
        Effect.gen(function* () {
            const result = isPointInLocationPolygon(
                { lat: 2, lng: 2 },
                squarePolygon,
            );
            assertEquals(result, false);
        }),
    );

    it.effect("returns false for empty polygon", () =>
        Effect.gen(function* () {
            const result = isPointInLocationPolygon(
                { lat: 0.5, lng: 0.5 },
                [],
            );
            assertEquals(result, false);
        }),
    );

    it.effect("returns false for polygon with too few points", () =>
        Effect.gen(function* () {
            const result = isPointInLocationPolygon(
                { lat: 0.5, lng: 0.5 },
                [[{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }]],
            );
            assertEquals(result, false);
        }),
    );

    it.effect("handles multi-ring polygons", () =>
        Effect.gen(function* () {
            const multiRing = [
                [
                    { lat: 0, lng: 0 },
                    { lat: 0, lng: 1 },
                    { lat: 1, lng: 1 },
                    { lat: 1, lng: 0 },
                ],
                [
                    { lat: 10, lng: 10 },
                    { lat: 10, lng: 11 },
                    { lat: 11, lng: 11 },
                    { lat: 11, lng: 10 },
                ],
            ];
            assertEquals(
                isPointInLocationPolygon({ lat: 0.5, lng: 0.5 }, multiRing),
                true,
            );
            assertEquals(
                isPointInLocationPolygon({ lat: 10.5, lng: 10.5 }, multiRing),
                true,
            );
            assertEquals(
                isPointInLocationPolygon({ lat: 5, lng: 5 }, multiRing),
                false,
            );
        }),
    );
});
