import type { AnyRouteMatch } from "@tanstack/react-router";
import { QueryResult, useQuery } from "@confect/react";
import { IconMapPinSearch, IconRefresh } from "@tabler/icons-react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Schema } from "effect";

import refs from "@cataster/backend/confect/_generated/refs";
import { Button } from "@cataster/ui/components/base/button";
import { LocationId } from "@cataster/validators";

import { LocationPicker } from "~/component/locations/picker";
import { getWireError, wireErrorMessage } from "~/lib/confect-error-ui";
import { PARAM_PLACEHOLDER } from "~/router";

export const Route = createFileRoute("/app/locations/$id")({
    staticData: {
        breadcrumb: LocationBreadcrumb,
    },
    params: {
        parse: (raw) =>
            Schema.validateSync(Schema.Struct({ id: LocationId }))(raw),
    },
    errorComponent: LocationRouteError,
    onError: (error) => {
        if (error?.routerCode === "PARSE_PARAMS")
            throw redirect({ to: "/app/locations" });
    },
    component: LocationsLayout,
});

function LocationRouteError({
    error,
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    const wire = getWireError(error);

    return (
        <div className="container space-y-4 py-8">
            <p className="text-muted-foreground">
                {wire ? wireErrorMessage(wire) : error.message}
            </p>
            <Button onClick={reset} variant="secondary">
                <IconRefresh data-icon="inline-start" />
                Erneut versuchen
            </Button>
        </div>
    );
}

function LocationsLayout() {
    const { id } = Route.useParams();
    if (id === PARAM_PLACEHOLDER) {
        return <LocationPicker />;
    }
    return <Outlet />;
}

function LocationBreadcrumb({ match }: { match: AnyRouteMatch }) {
    const id = (match.params as { id: string }).id as LocationId;
    const location = useQuery(
        refs.public.locations.get,
        id === PARAM_PLACEHOLDER ? "skip" : { id },
    );

    if (id === PARAM_PLACEHOLDER) {
        return <IconMapPinSearch className="size-4" />;
    }

    return QueryResult.match(location, {
        onLoading: () => "Standort",
        onFailure: () => "Standort",
        onSuccess: (location) => location.name,
    });
}
