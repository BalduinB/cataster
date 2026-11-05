import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { QueryResult, useQuery } from "@confect/react";
import { createFileRoute, Link } from "@tanstack/react-router";

import refs from "@cataster/backend/confect/_generated/refs";
import { Button, buttonVariants } from "@cataster/ui/components/base/button";

export const Route = createFileRoute("/(www)/")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <main className="container h-screen py-16">
            <div className="flex flex-col items-center justify-center gap-6">
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
                    Create <span className="text-primary">T33</span> Turbo
                </h1>

                <AuthShowcase />

                <HealthIndicator />

                <Link
                    to="/app/locations"
                    className={buttonVariants({ variant: "outline" })}
                >
                    Standorte ansehen
                </Link>
            </div>
        </main>
    );
}

function AuthShowcase() {
    return (
        <>
            <Show when={"signed-out"}>
                <SignInButton mode="modal">
                    <Button size="lg">Sign in</Button>
                </SignInButton>
            </Show>
            <Show when={"signed-in"}>
                <UserButton />
            </Show>
        </>
    );
}

function HealthIndicator() {
    const health = useQuery(refs.public.health.ping, {});

    return QueryResult.match(health, {
        onLoading: () => <HealthSkeleton />,
        onSuccess: (data) => (
            <p className="text-muted-foreground text-lg">
                Connected — server time:{" "}
                <span className="text-foreground font-mono">
                    {new Date(data.now).toISOString()}
                </span>
            </p>
        ),
    });
}

function HealthSkeleton() {
    return (
        <p className="text-muted-foreground text-lg">
            Connecting to the backend…
        </p>
    );
}
