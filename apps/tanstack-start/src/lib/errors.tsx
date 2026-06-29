import type { ReactNode } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";

import type { WireError } from "@cataster/validators";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@cataster/ui/components/base/alert";
import { cn } from "@cataster/ui/lib/utils";
import { isWireError } from "@cataster/validators";

export interface TaggedError {
    readonly _tag: string;
}

type NonWireError<Error extends TaggedError> = Exclude<Error, WireError>;

type ErrorByTag<Error extends TaggedError, Tag extends string> =
    Extract<NonWireError<Error>, { readonly _tag: Tag }> extends never
        ? NonWireError<Error> & { readonly _tag: Tag }
        : Extract<NonWireError<Error>, { readonly _tag: Tag }>;

type TagHandlers<Error extends TaggedError, Result> = Partial<{
    readonly [Tag in NonWireError<Error>["_tag"]]: (
        error: ErrorByTag<Error, Tag>,
    ) => Result;
}>;

type ErrorFallback<Result> = Result | ((error: unknown) => Result);

export type ErrorComponentCustom<Error extends TaggedError> = TagHandlers<
    Error,
    ReactNode
>;

export type ErrorMessageCustom<Error extends TaggedError> = TagHandlers<
    Error,
    string
>;

export interface ErrorComponentProps<Error extends TaggedError = TaggedError> {
    readonly error: unknown;
    readonly custom?: ErrorComponentCustom<Error>;
    readonly fallback?: ErrorFallback<ReactNode>;
    readonly className?: string;
}

export function getWireError(error: unknown): WireError | null {
    if (isWireError(error)) return error;
    return null;
}

export function wireErrorMessage(error: WireError): string {
    switch (error._tag) {
        case "Unauthorized":
            return "Bitte melde dich an, um fortzufahren.";
        case "Forbidden":
            return error.message;
        case "NotFound":
            return error.message;
        case "Conflict":
            return error.message;
        default:
            error satisfies never;
            return "Ein unerwarteter Fehler ist aufgetreten.";
    }
}

function wireErrorTitle(error: WireError): string {
    switch (error._tag) {
        case "Unauthorized":
            return "Anmeldung erforderlich";
        case "Forbidden":
            return "Kein Zugriff";
        case "NotFound":
            return "Nicht gefunden";
        case "Conflict":
            return "Konflikt erkannt";
        default:
            error satisfies never;
            return "Etwas ist schiefgelaufen";
    }
}

function errorTitle(error: unknown): string {
    const wire = getWireError(error);
    if (wire) return wireErrorTitle(wire);

    if (isTaggedError(error)) return "Etwas ist schiefgelaufen";

    return "Unerwarteter Fehler";
}

function isTaggedError(error: unknown): error is TaggedError {
    return (
        typeof error === "object" &&
        error !== null &&
        "_tag" in error &&
        typeof error._tag === "string"
    );
}

function getFallback<Result>(
    fallback: ErrorFallback<Result>,
    error: unknown,
): Result {
    return typeof fallback === "function"
        ? (fallback as (error: unknown) => Result)(error)
        : fallback;
}

function matchCustomError<Error extends TaggedError, Result>(
    error: unknown,
    custom: TagHandlers<Error, Result> | undefined,
): Result | undefined {
    if (!custom || !isTaggedError(error)) return undefined;

    const handler = custom[error._tag as NonWireError<Error>["_tag"]];
    if (!handler) return undefined;

    return handler(error as ErrorByTag<Error, NonWireError<Error>["_tag"]>);
}

export function errorMessage<Error extends TaggedError = TaggedError>(
    error: unknown,
    options: {
        readonly custom?: ErrorMessageCustom<Error>;
        readonly fallback?: ErrorFallback<string>;
    } = {},
): string {
    const wire = getWireError(error);
    if (wire) return wireErrorMessage(wire);

    const custom = matchCustomError(error, options.custom);
    if (custom !== undefined) return custom;

    return getFallback(
        options.fallback ?? "Ein unerwarteter Fehler ist aufgetreten.",
        error,
    );
}

export function mutationErrorMessage<Error extends TaggedError = TaggedError>(
    error: unknown,
    options?: {
        readonly custom?: ErrorMessageCustom<Error>;
        readonly fallback?: ErrorFallback<string>;
    },
): string {
    return errorMessage(error, options);
}

export function ErrorComponent<Error extends TaggedError = TaggedError>({
    error,
    custom,
    fallback = "Ein unerwarteter Fehler ist aufgetreten.",
    className,
}: ErrorComponentProps<Error>) {
    const wire = getWireError(error);
    const customContent = matchCustomError(error, custom);
    const content =
        wire !== null
            ? wireErrorMessage(wire)
            : customContent !== undefined
              ? customContent
              : getFallback(fallback, error);

    return (
        <Alert
            variant="destructive"
            className={cn(
                "border-destructive/20 bg-destructive/5 shadow-none",
                className,
            )}
        >
            <IconAlertTriangle aria-hidden="true" />
            <AlertTitle>{errorTitle(error)}</AlertTitle>
            <AlertDescription>{content}</AlertDescription>
        </Alert>
    );
}
