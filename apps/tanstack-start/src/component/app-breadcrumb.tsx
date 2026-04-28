import type { AnyRouteMatch } from "@tanstack/react-router";
import * as React from "react";
import { Link, useMatches } from "@tanstack/react-router";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@cataster/ui/components/base/breadcrumb";

export function AppBreadcrumbs() {
    const matches = useMatches();
    const items = matches.filter(
        (match) => match.staticData.breadcrumb !== undefined,
    );

    if (items.length === 0) return null;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {items.map((match, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <React.Fragment key={match.id}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>
                                        <BreadcrumbContent match={match} />
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink
                                        render={
                                            <Link
                                                // The pathname is a runtime-resolved
                                                // URL of an active match; the typed
                                                // `to` only knows literal route
                                                // strings, so we widen it here.
                                                to={match.pathname as never}
                                            />
                                        }
                                    >
                                        <BreadcrumbContent match={match} />
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast ? <BreadcrumbSeparator /> : null}
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

function BreadcrumbContent({ match }: { match: AnyRouteMatch }) {
    const value = match.staticData.breadcrumb;
    if (value === undefined) return null;
    if (typeof value === "string") return value;
    const Component = value;
    return <Component match={match} />;
}
