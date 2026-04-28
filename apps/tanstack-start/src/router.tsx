/// <reference types="vite/client" />
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import {
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

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
