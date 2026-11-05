/**
 * Adapts `@confect/react`'s mutation/action invokers to TanStack Query's
 * `useMutation`, which owns the UI state (pending, error, data, callbacks).
 * Shared wire errors are toasted globally by the `MutationCache` in
 * `router.tsx`.
 */
import type { UseMutationOptions } from "@tanstack/react-query";
import { Ref } from "@confect/core";
import { useAction, useMutation } from "@confect/react";
import { useMutation as useTanstackMutation } from "@tanstack/react-query";
import { Result } from "effect";

type ConfectMutationOptions<R extends Ref.Any> = Omit<
    UseMutationOptions<Ref.Returns<R>, Ref.Error<R> | Error, Ref.Args<R>>,
    "mutationFn"
>;

type Invoke<R extends Ref.Any> = (args: Ref.Args<R>) => Promise<unknown>;

/**
 * Confect resolves functions with an error schema to a `Result`; TanStack
 * expects a rejected promise, so the failure is rethrown.
 */
const unwrap = async <R extends Ref.Any>(
    ref: R,
    pending: Promise<unknown>,
): Promise<Ref.Returns<R>> => {
    const value = await pending;
    return Ref.hasErrorSchema(ref)
        ? Result.getOrThrow(
              value as Result.Result<Ref.Returns<R>, Ref.Error<R>>,
          )
        : (value as Ref.Returns<R>);
};

export function useConfectMutation<R extends Ref.AnyPublicMutation>(
    ref: R,
    options?: ConfectMutationOptions<R>,
) {
    const invoke = useMutation(ref) as unknown as Invoke<R>;
    return useTanstackMutation({
        ...options,
        mutationFn: (args) => unwrap(ref, invoke(args)),
    });
}

export function useConfectAction<R extends Ref.AnyPublicAction>(
    ref: R,
    options?: ConfectMutationOptions<R>,
) {
    const invoke = useAction(ref) as unknown as Invoke<R>;
    return useTanstackMutation({
        ...options,
        mutationFn: (args) => unwrap(ref, invoke(args)),
    });
}
