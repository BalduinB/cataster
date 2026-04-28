import { ConflictError } from "@cataster/validators";
import { Effect } from "effect";
import { rrulestr } from "rrule";

export const DEFAULT_CONTROL_TIMEZONE = "Europe/Berlin";

function formatIcsDtstartInTimezone(ms: number, tzid: string): string {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: tzid,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = dtf.formatToParts(new Date(ms));
  const g = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}${g("month")}${g("day")}T${g("hour")}${g("minute")}${g("second")}`;
}

function wrapRRuleLineForForcesetParse(
  rruleLine: string,
  baseMs: number,
  tzid: string,
): string {
  const dt = formatIcsDtstartInTimezone(baseMs, tzid);
  const body = rruleLine.trim().replace(/^RRULE:/i, "");
  return `DTSTART;TZID=${tzid}:${dt}\nRRULE:${body}`;
}

export function normalizeOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Effect-shaped versions of the validators. Failures land on the
 * `ConflictError` channel so handlers can `yield*` them directly without a
 * `try/catch`.
 */
export const validateVitality = (vitality: number): Effect.Effect<void, ConflictError> =>
  Number.isInteger(vitality) && vitality >= 0 && vitality <= 4
    ? Effect.void
    : Effect.fail(
        new ConflictError({
          message: "Vitality must be an integer between 0 and 4",
        }),
      );

export const validateMeasurement = (
  fieldName: string,
  value: number,
  options: { allowZero?: boolean } = {},
): Effect.Effect<void, ConflictError> => {
  const minimum = options.allowZero ? 0 : Number.EPSILON;
  if (Number.isFinite(value) && value >= minimum) {
    return Effect.void;
  }
  const comparison = options.allowZero ? "greater than or equal to 0" : "greater than 0";
  return Effect.fail(
    new ConflictError({ message: `${fieldName} must be ${comparison}` }),
  );
};

export type TreeMeasurements = {
  readonly circumference: number;
  readonly height: number;
  readonly crownDiameter: number;
  readonly vitality: number;
};

export const validateTreeMeasurements = (
  tree: TreeMeasurements,
): Effect.Effect<void, ConflictError> =>
  Effect.gen(function* () {
    yield* validateMeasurement("Circumference", tree.circumference);
    yield* validateMeasurement("Height", tree.height);
    yield* validateMeasurement("Crown diameter", tree.crownDiameter, {
      allowZero: true,
    });
    yield* validateVitality(tree.vitality);
  });

export const validateControlIntervalRRule = ({
  controlIntervalRRule,
  controlTimezone,
  baseDate,
}: {
  controlIntervalRRule: string | null | undefined;
  controlTimezone?: string | undefined;
  baseDate: number;
}): Effect.Effect<string | undefined, ConflictError> => {
  const normalizedRule = normalizeOptionalString(controlIntervalRRule);
  if (!normalizedRule) return Effect.succeed(undefined);

  const tz = controlTimezone ?? DEFAULT_CONTROL_TIMEZONE;
  return Effect.try({
    try: () => {
      rrulestr(wrapRRuleLineForForcesetParse(normalizedRule, baseDate, tz), {
        compatible: true,
        forceset: true,
        tzid: tz,
      });
      return normalizedRule;
    },
    catch: () => new ConflictError({ message: "Invalid control interval RRULE" }),
  });
};

export const computeNextControlAt = ({
  controlIntervalRRule,
  controlTimezone,
  additionalControlAt,
  baseDate,
  now = Date.now(),
}: {
  controlIntervalRRule?: string;
  controlTimezone?: string;
  additionalControlAt?: number;
  baseDate: number;
  now?: number;
}): Effect.Effect<number | undefined, ConflictError> =>
  Effect.gen(function* () {
    const candidates: Array<number> = [];

    if (controlIntervalRRule) {
      const tz = controlTimezone ?? DEFAULT_CONTROL_TIMEZONE;
      const nextOccurrence = yield* Effect.try({
        try: () => {
          const parsedRule = rrulestr(
            wrapRRuleLineForForcesetParse(controlIntervalRRule, baseDate, tz),
            { compatible: true, forceset: true, tzid: tz },
          );
          return parsedRule.after(new Date(now), true);
        },
        catch: () =>
          new ConflictError({ message: "Invalid control interval RRULE" }),
      });
      if (nextOccurrence) {
        candidates.push(nextOccurrence.getTime());
      }
    }

    if (additionalControlAt !== undefined && additionalControlAt >= now) {
      candidates.push(additionalControlAt);
    }

    if (candidates.length === 0) {
      return undefined;
    }

    return Math.min(...candidates);
  });
