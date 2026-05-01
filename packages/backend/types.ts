/**
 * Shared, schema-derived types for client consumption.
 *
 * Confect decodes documents through Effect-Schema, which produces deeply
 * `readonly` shapes. Convex's generated `Doc<>` types are mutable. The two
 * are structurally identical at runtime, but assignment between them flags
 * a TS error, so client code should consume these aliases instead of the
 * Convex `Doc<>` types when displaying data returned from a Confect query.
 */

import type { Schema } from "effect";

import {
  hiddenSpecies as hiddenSpeciesTable,
  locations as locationsTable,
  species as speciesTable,
  trees as treesTable,
} from "./confect/schema";

export type LocationDoc = Schema.Schema.Type<typeof locationsTable.Doc>;
export type SpeciesDoc = Schema.Schema.Type<typeof speciesTable.Doc>;
export type HiddenSpeciesDoc = Schema.Schema.Type<typeof hiddenSpeciesTable.Doc>;
export type TreeDoc = Schema.Schema.Type<typeof treesTable.Doc>;

export type LocationId = LocationDoc["_id"];
export type SpeciesId = SpeciesDoc["_id"];
export type HiddenSpeciesId = HiddenSpeciesDoc["_id"];
export type TreeId = TreeDoc["_id"];

export type { LatLng } from "@cataster/validators";
