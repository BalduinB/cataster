/// <reference types="vite/client" />
import type { ConvexReactClient } from "convex/react";
import type * as React from "react";
import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import {
    createRootRouteWithContext,
    HeadContent,
    Outlet,
    Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { Toaster } from "@cataster/ui/components/base/sonner";

import { ModeToggle } from "~/component/mode-toggle";
import { ThemeProvider } from "~/component/theme-provider";
import { env } from "~/env";
import { AbilityProvider } from "~/lib/abilities";
import appCss from "~/styles.css?url";

export const Route = createRootRouteWithContext<{
    convexClient: ConvexReactClient;
}>()({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
        ],
        links: [{ rel: "stylesheet", href: appCss }],
    }),
    component: RootComponent,
});

function RootComponent() {
    const { convexClient } = Route.useRouteContext();

    return (
        <ClerkProvider
            publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}
            routerDebug
        >
            <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
                <AbilityProvider>
                    <RootDocument>
                        <Outlet />
                    </RootDocument>
                </AbilityProvider>
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider defaultTheme="system" storageKey="theme">
            <html lang="en" suppressHydrationWarning>
                <head>
                    <HeadContent />
                </head>
                <body className="bg-background text-foreground min-h-screen font-sans antialiased">
                    {children}

                    <ModeToggle className="fixed top-4 right-4 z-50" />

                    <Toaster />
                    <TanStackRouterDevtools position="bottom-right" />
                    <Scripts />
                    <TailwindBreakpointsHint />
                </body>
            </html>
        </ThemeProvider>
    );
}

function TailwindBreakpointsHint() {
    return (
        <div className="bg-background fixed bottom-4 left-4 z-50 flex size-10 items-center justify-center rounded-full border">
            <div className="text-foreground text-sm">
                <span className="inline sm:hidden">xs</span>
                <span className="hidden sm:inline md:hidden">sm</span>
                <span className="hidden md:inline lg:hidden">md</span>
                <span className="hidden lg:inline xl:hidden">lg</span>
                <span className="hidden xl:inline 2xl:hidden">xl</span>
                <span className="hidden 2xl:inline">2xl</span>
            </div>
        </div>
    );
}
