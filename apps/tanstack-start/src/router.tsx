/// <reference types="vite/client" />
import type * as React from "react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import {
    AnyRouteMatch,
    createRouter as createTanStackRouter,
    Link,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";

import { buttonVariants } from "@cataster/ui/components/base/button";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
    const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
    if (!CONVEX_URL) {
        throw new Error("missing VITE_CONVEX_URL envar");
    }

    const convex = new ConvexReactClient(CONVEX_URL, {
        unsavedChangesWarning: false,
    });
    const convexQueryClient = new ConvexQueryClient(convex);

    const queryClient: QueryClient = new QueryClient({
        defaultOptions: {
            queries: {
                queryKeyHashFn: convexQueryClient.hashFn(),
                queryFn: convexQueryClient.queryFn(),
            },
        },
    });
    convexQueryClient.connect(queryClient);

    const router = createTanStackRouter({
        routeTree,
        defaultPreload: "intent",
        context: { queryClient, convexClient: convex, convexQueryClient },
        scrollRestoration: true,
        defaultNotFoundComponent: NotFound,
        Wrap: ({ children }) => (
            <ConvexProvider client={convex}>{children}</ConvexProvider>
        ),
    });
    setupRouterSsrQueryIntegration({ router, queryClient });

    return router;
}

function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
                    404
                </p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Page not found
                </h1>
                <p className="text-muted-foreground max-w-md text-sm">
                    The page you&apos;re looking for doesn&apos;t exist or may
                    have been moved.
                </p>
            </div>

            <Link to="/" className={buttonVariants({ variant: "outline" })}>
                Go home
            </Link>
        </div>
    );
}
/**
 * A breadcrumb entry contributed by a route via `staticData.breadcrumb`.
 *
 * Either a literal string for static labels, or a React component rendered
 * with the active match — useful when the label depends on params or cached
 * loader data (e.g. resolving an id to a name).
 */
export type BreadcrumbStaticData =
    | string
    | React.ComponentType<{ match: AnyRouteMatch }>;

/**
 * Sidebar groups a route can be sorted into. The display labels live in
 * `app-sidebar.tsx` (`groupLabelMap`) so renaming a group is a single edit.
 */
export type NavGroup = "general" | "data";

/**
 * Placeholder substituted into dynamic params (e.g. `$id`) when a route is
 * linked to before a real value is chosen — the matching layout intercepts
 * this and renders a picker instead of the detail content.
 */
export const PARAM_PLACEHOLDER = "~";

/**
 * A sidebar entry contributed by a route via `staticData.nav`. Routes without
 * this field are simply omitted from the sidebar.
 *
 * Two shapes:
 * - **Top-level** (`group`): renders as a primary sidebar entry under the
 *   matching group label.
 * - **Sub-nav** (`parent`): nested under the top-level item whose `fullPath`
 *   matches `parent`, surfaced via a hover-revealed dropdown. Dynamic params
 *   in the sub-nav's path are filled with `PARAM_PLACEHOLDER` so the link is
 *   navigable without context.
 */
export type NavStaticData = {
    title: string;
    icon?: React.ComponentType<{ className?: string }>;
} & ({ group?: NavGroup; parent?: never } | { parent: string; group?: never });

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
    interface StaticDataRouteOption {
        breadcrumb?: BreadcrumbStaticData;
        nav?: NavStaticData;
    }
}
