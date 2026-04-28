/**
 * Thin adapter from Confect refs (`@confect/core`) to the existing
 * `@convex-dev/react-query` + TanStack Query SSR setup.
 *
 * - `confectQuery(ref, args)` produces options compatible with
 *   `useSuspenseQuery` and `queryClient.ensureQueryData(...)`. It re-uses the
 *   global Convex default `queryFn` (set in `router.tsx`), and decodes the raw
 *   wire result through the ref's Effect Schema using `select`.
 * - `useConfectMutationFn(ref)` returns a `mutationFn` you can plug into
 *   `useMutation({ mutationFn, ... })`. Args are encoded; the result is
 *   decoded; errors propagate untouched.
 * - `decodeConfectError(error)` reconstructs a typed `WireError` from a
 *   `ConvexError` thrown by the backend's `surfaceErrors` helper. Returns
 *   `null` for any other error.
 */

import { Ref } from "@confect/core";
import { useConvexMutation } from "@convex-dev/react-query";
import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import { Either, Schema } from "effect";

import type { WireError } from "@cataster/validators";
import { WireErrorUnion } from "@cataster/validators";

const decodeWireError = Schema.decodeUnknownEither(WireErrorUnion);

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

        const raw = await (
            inner as (a: Record<string, unknown>) => Promise<unknown>
        )(encoded);

        // See note in `confectQuery` on why the unsafe-return is acceptable here.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Ref.decodeReturnsSync(ref, raw);
    };
}

/**
 * Mirror of `useConfectMutationFn` for `publicAction` refs (e.g. OSM lookups).
 *
 * Convex actions don't get a TanStack Query subscription, so we use the
 * imperative `useAction` hook from `convex/react` and shape its caller into
 * a `mutationFn`-compatible function. The wrapper handles arg encoding and
 * return decoding the same way the mutation flavour does.
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

        const raw = await (
            inner as (a: Record<string, unknown>) => Promise<unknown>
        )(encoded);

        // See note in `confectQuery` on why the unsafe-return is acceptable here.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Ref.decodeReturnsSync(ref, raw);
    };
}

export function decodeConfectError(error: unknown): WireError | null {
    if (!(error instanceof ConvexError)) return null;

    const result = decodeWireError(error.data);

    return Either.isRight(result) ? result.right : null;
}
