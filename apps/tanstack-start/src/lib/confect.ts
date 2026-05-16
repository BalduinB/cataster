/**
 * Thin adapter from Confect refs (`@confect/core`) to the existing
 * `@convex-dev/react-query` + TanStack Query SSR setup.
 *
 * - `confectQuery(ref, args)` produces options compatible with
 *   `useSuspenseQuery` and `queryClient.ensureQueryData(...)`. It re-uses the
 *   global Convex default `queryFn` (set in `router.tsx`), and decodes the raw
 *   wire result through the ref's Effect Schema using `select`.
 * - `useConfectMutation` / `useConfectAction` wrap TanStack mutations with a
 *   ref-aware `mutationFn` that decodes `ConvexError` into the ref's declared
 *   error union so `onError` stays typed.
 * - `decodeWireErrorFromUnknown` decodes only the shared base wire errors for
 *   generic toasts and route fallbacks.
 */
import type {
    UseMutationOptions,
    UseMutationResult,
} from "@tanstack/react-query";
import { Ref } from "@confect/core";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { useAction } from "convex/react";
import { Either, Option, Schema } from "effect";

import type { WireError } from "@cataster/validators";
import { isWireError, WireErrorUnion } from "@cataster/validators";

const decodeWireErrorSchema = Schema.decodeUnknownEither(WireErrorUnion);

export function confectQuery<R extends Ref.AnyPublicQuery>(
    ref: R,
    args: Ref.Args<R>,
) {
    // Store the function *name* (not the FunctionReference object) in the
    // queryKey. Convex FunctionReferences carry their identity on a Symbol-keyed
    // property, which is silently dropped by `JSON.stringify` during SSR
    // dehydration. After hydration the queryKey would otherwise contain `{}`,
    // and `ConvexQueryClient.subscribeInner` would call `watchQuery({})` →
    // `getFunctionAddress` would throw "[object Object] is not a
    // functionReference". A string survives serialization and is accepted by
    // both `watchQuery` and the Convex hashFn.
    const funcName = Ref.getConvexFunctionName(ref);
    const encodedArgs = Ref.encodeArgsSync(ref, args) as Record<
        string,
        unknown
    >;

    return {
        queryKey: ["convexQuery", funcName, encodedArgs] as const,
        select: (raw: unknown): Ref.Returns<R> =>
            // `decodeReturnsSync`'s declared return is `Ref.Returns<R>`, but inside
            // a generic body that erases to `any`. The cast is safe because the
            // schema decoder validates at runtime.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            Ref.decodeReturnsSync(ref, raw),
        staleTime: Infinity,
    };
}

/**
 * Decode a thrown value against the ref's declared error schema (Confect v7).
 * Returns `undefined` when the value is not a matching typed application error.
 */
export function decodeRefError<R extends Ref.Any>(
    ref: R,
    error: unknown,
): Ref.Error<R> | undefined {
    if (!Ref.isConvexError(error)) return undefined;
    const decoded = Ref.decodeErrorSync(ref, error.data);
    if (Option.isNone(decoded)) return undefined;
    // `decodeErrorSync` erases to the schema type only at the ref boundary.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- ref-scoped decode
    return decoded.value;
}

/**
 * Normalize a Convex failure into the ref's typed error when possible, so
 * TanStack `onError` handlers receive decoded tagged errors instead of raw
 * `ConvexError` instances.
 */
export function normalizeConfectFailure<R extends Ref.Any>(
    ref: R,
    error: unknown,
): unknown {
    const decoded = decodeRefError(ref, error);
    return decoded ?? error;
}

/** Decode shared base wire errors (`Unauthorized`, `Forbidden`, …). */
export function decodeWireErrorFromUnknown(error: unknown): WireError | null {
    if (isWireError(error)) return error;
    if (!Ref.isConvexError(error)) return null;
    const result = decodeWireErrorSchema(error.data);
    return Either.isRight(result) ? result.right : null;
}

/** @deprecated Use `decodeWireErrorFromUnknown` */
export function decodeConfectError(error: unknown): WireError | null {
    return decodeWireErrorFromUnknown(error);
}

export function useConfectMutationFn<R extends Ref.AnyPublicMutation>(
    ref: R,
): (args: Ref.Args<R>) => Promise<Ref.Returns<R>> {
    const funcRef = Ref.getFunctionReference(ref);

    const inner = useConvexMutation(funcRef);

    return async (args) => {
        const encoded = Ref.encodeArgsSync(ref, args) as Record<
            string,
            unknown
        >;

        try {
            const raw = await (
                inner as (a: Record<string, unknown>) => Promise<unknown>
            )(encoded);

            // See note in `confectQuery` on why the unsafe-return is acceptable here.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return Ref.decodeReturnsSync(ref, raw);
        } catch (error) {
            throw normalizeConfectFailure(ref, error);
        }
    };
}

type ConfectMutationError<R extends Ref.AnyPublicMutation> =
    Ref.Error<R> extends never ? Error : Ref.Error<R> | Error;

/**
 * TanStack mutation wired to a Confect ref with typed `onError` when the ref
 * declares an `error` schema.
 */
export function useConfectMutation<R extends Ref.AnyPublicMutation>(
    ref: R,
    options?: Omit<
        UseMutationOptions<
            Ref.Returns<R>,
            ConfectMutationError<R>,
            Ref.Args<R>
        >,
        "mutationFn"
    >,
): UseMutationResult<Ref.Returns<R>, ConfectMutationError<R>, Ref.Args<R>> {
    const mutationFn = useConfectMutationFn(ref);
    return useMutation({ ...options, mutationFn });
}

/**
 * Mirror of `useConfectMutationFn` for `publicAction` refs (e.g. OSM lookups).
 */
export function useConfectActionFn<R extends Ref.AnyPublicAction>(
    ref: R,
): (args: Ref.Args<R>) => Promise<Ref.Returns<R>> {
    const funcRef = Ref.getFunctionReference(ref);

    const inner = useAction(funcRef);

    return async (args) => {
        const encoded = Ref.encodeArgsSync(ref, args) as Record<
            string,
            unknown
        >;

        try {
            const raw = await (
                inner as (a: Record<string, unknown>) => Promise<unknown>
            )(encoded);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return Ref.decodeReturnsSync(ref, raw);
        } catch (error) {
            throw normalizeConfectFailure(ref, error);
        }
    };
}

type ConfectActionError<R extends Ref.AnyPublicAction> =
    Ref.Error<R> extends never ? Error : Ref.Error<R> | Error;

export function useConfectAction<R extends Ref.AnyPublicAction>(
    ref: R,
    options?: Omit<
        UseMutationOptions<Ref.Returns<R>, ConfectActionError<R>, Ref.Args<R>>,
        "mutationFn"
    >,
): UseMutationResult<Ref.Returns<R>, ConfectActionError<R>, Ref.Args<R>> {
    const mutationFn = useConfectActionFn(ref);
    return useMutation({ ...options, mutationFn });
}
