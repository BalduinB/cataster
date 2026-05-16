import { Cause, Effect, Logger } from "effect";

/**
 * Logger layer chosen at runtime:
 *
 *   - prod (`NODE_ENV=production`) → JSON, one record per line, parseable by
 *     log aggregators downstream of the Convex log stream.
 *   - dev → Effect's pretty colored logger (the default), which is what
 *     `npx convex dev` and the local terminal render best.
 *
 * Override with `LOG_FORMAT=json|logfmt|pretty` if you need to flip without
 * redeploying (e.g. running prod-format locally to debug a parser).
 */
const fmt =
    process.env.LOG_FORMAT ??
    (process.env.NODE_ENV === "production" ? "json" : "pretty");

export const LoggerLive =
    fmt === "json"
        ? Logger.json
        : fmt === "logfmt"
          ? Logger.logFmt
          : Logger.pretty;

/**
 * Boundary for a single use-case (one Convex function call). Emits exactly
 * one structured log line per invocation — the "wide event":
 *
 *   - `<name>.ok`   on success
 *   - `<name>.fail` on failure (with pretty-printed cause)
 *
 * Both lines carry every annotation the handler accumulated via
 * `Effect.annotateLogsScoped(...)` anywhere in the call tree, plus a
 * `<name>` log span recording the elapsed time.
 *
 * Compose **before** `surfaceErrors`: we still want the typed error here so
 * the wide event can record it, and `surfaceErrors` then converts whatever
 * remains into a `ConvexError` at the very edge.
 *
 * `Effect.scoped` is included so handlers can use `annotateLogsScoped`
 * without each one having to remember to open a scope.
 */
export const wideEvent =
    (name: string) =>
    <A, E, R>(self: Effect.Effect<A, E, R>) =>
        self.pipe(
            Effect.tap(() => Effect.logInfo(`${name}.ok`)),
            Effect.tapErrorCause((cause) =>
                Effect.logError(`${name}.fail`).pipe(
                    Effect.annotateLogs("error", Cause.pretty(cause)),
                ),
            ),
            Effect.withLogSpan(name),
            Effect.annotateLogs("op", name),
            Effect.scoped,
        );
