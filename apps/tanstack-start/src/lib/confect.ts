/**
 * Small UI-state wrappers around `@confect/react`'s native mutation/action
 * hooks. Shared wire errors are toasted here; function-specific typed errors
 * are passed to `onError`.
 */
import type { Ref } from "@confect/core";
import { useCallback, useState } from "react";
import {
    useAction as useConfectReactAction,
    useMutation as useConfectReactMutation,
} from "@confect/react";
import { Either } from "effect";
import { toast } from "sonner";

import type { WireError } from "@cataster/validators";
import { isWireError } from "@cataster/validators";

import { mutationErrorMessage } from "./errors";

type ConfectStatus = "idle" | "pending" | "success" | "error";

type ConfectInvoke<R extends Ref.Any> = (
    args: Ref.Args<R>,
) => Promise<Ref.Returns<R> | Either.Either<Ref.Returns<R>, Ref.Error<R>>>;

type FunctionSpecificError<R extends Ref.Any> = Exclude<
    Ref.Error<R>,
    WireError
>;

interface UseConfectInvokeOptions<R extends Ref.Any> {
    onSuccess?: (
        data: Ref.Returns<R>,
        args: Ref.Args<R>,
    ) => void | Promise<void>;
    onError?: (
        error: FunctionSpecificError<R>,
        args: Ref.Args<R>,
    ) => void | Promise<void>;
    onSettled?: (
        data: Ref.Returns<R> | undefined,
        error: unknown,
        args: Ref.Args<R>,
    ) => void | Promise<void>;
    toastWireErrors?: boolean;
}

type UseConfectInvokeResult<R extends Ref.Any> = {
    mutate: (args: Ref.Args<R>) => void;
    mutateAsync: (args: Ref.Args<R>) => Promise<Ref.Returns<R>>;
    reset: () => void;
} & (
    | {
          status: "idle";
          isIdle: true;
          isPending: false;
          isSuccess: false;
          isError: false;
          data: undefined;
          error: undefined;
      }
    | {
          status: "success";
          isIdle: false;
          isPending: false;
          isSuccess: true;
          isError: false;
          data: Ref.Returns<R>;
      }
    | {
          status: "error";
          isIdle: false;
          isPending: false;
          isSuccess: false;
          isError: true;
          rawError: unknown;
          error: FunctionSpecificError<R> | undefined;
          data: undefined;
      }
    | {
          isIdle: false;
          isPending: true;
          isSuccess: false;
          isError: false;
          status: "pending";
          data: undefined;
          error: undefined;
      }
);

function useConfectInvoke<R extends Ref.Any>(
    invoke: ConfectInvoke<R>,
    options: UseConfectInvokeOptions<R> = {},
): UseConfectInvokeResult<R> {
    const [status, setStatus] = useState<ConfectStatus>("idle");
    const [data, setData] = useState<Ref.Returns<R>>();
    const [error, setError] = useState<FunctionSpecificError<R>>();
    const [rawError, setRawError] = useState<unknown>();

    const handleError = useCallback(
        async (nextError: unknown, args: Ref.Args<R>) => {
            setRawError(nextError);
            setStatus("error");

            if (isWireError(nextError)) {
                if (options.toastWireErrors !== false)
                    toast.error(mutationErrorMessage(nextError));
            } else {
                setError(nextError as FunctionSpecificError<R>);
                await options.onError?.(
                    nextError as FunctionSpecificError<R>,
                    args,
                );
            }

            await options.onSettled?.(undefined, nextError, args);
        },
        [options],
    );

    const mutateAsync = useCallback(
        async (args: Ref.Args<R>) => {
            setStatus("pending");
            setError(undefined);
            setRawError(undefined);
            setData(undefined);

            let result;
            try {
                result = await invoke(args);
            } catch (nextError) {
                await handleError(nextError, args);
                throw nextError;
            }

            if (!Either.isEither(result)) {
                // map no error schema to right
                result = Either.right(result);
            }
            return Either.match(result, {
                onLeft: async (nextError) => {
                    await handleError(nextError, args);
                    throw nextError;
                },
                onRight: async (nextData) => {
                    setData(nextData);
                    setStatus("success");
                    await options.onSuccess?.(nextData, args);
                    await options.onSettled?.(nextData, undefined, args);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return nextData;
                },
            });
        },
        [handleError, invoke, options],
    );

    const mutate = useCallback(
        (args: Ref.Args<R>) => {
            void mutateAsync(args).catch(() => undefined);
        },
        [mutateAsync],
    );

    const reset = useCallback(() => {
        setStatus("idle");
        setData(undefined);
        setError(undefined);
        setRawError(undefined);
    }, []);

    return {
        mutate,
        mutateAsync,
        reset,
        status,
        data,
        error,
        rawError,
        isIdle: status === "idle",
        isPending: status === "pending",
        isSuccess: status === "success",
        isError: status === "error",
    } as UseConfectInvokeResult<R>;
}

/**
 * Confect mutation with small TanStack-like UI state.
 */
export function useConfectMutation<R extends Ref.AnyPublicMutation>(
    ref: R,
    options?: UseConfectInvokeOptions<R>,
): UseConfectInvokeResult<R> {
    const invoke = useConfectReactMutation(ref);
    return useConfectInvoke(invoke, options);
}

/**
 * Confect action with small TanStack-like UI state.
 */
export function useConfectAction<R extends Ref.AnyPublicAction>(
    ref: R,
    options?: UseConfectInvokeOptions<R>,
): UseConfectInvokeResult<R> {
    const invoke = useConfectReactAction(ref);
    return useConfectInvoke(invoke, options);
}
