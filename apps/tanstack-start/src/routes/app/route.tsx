import {
    CreateOrganization,
    OrganizationList,
    Show,
    SignInButton,
    useUser,
} from "@clerk/tanstack-react-start";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Button } from "@cataster/ui/components/base/button";
import { Separator } from "@cataster/ui/components/base/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@cataster/ui/components/base/sidebar";

import { AppBreadcrumbs } from "~/component/app-breadcrumb";
import { AppSidebar } from "~/component/app-sidebar";
import { useHasActiveOrg } from "~/lib/abilities";

export const Route = createFileRoute("/app")({
    component: RouteComponent,
});

/**
 * Multi-tenant app shell:
 *   - signed-out → sign-in prompt (Clerk modal)
 *   - signed-in but no active org → onboarding (create or pick an org)
 *   - signed-in with active org → the app
 *
 * Clerk has organizations marked as required, so the "no org" branch should
 * only appear briefly between sign-in and `setActive`, or for users invited
 * to multiple orgs without one chosen yet.
 */
function RouteComponent() {
    return (
        <>
            <Show when={"signed-out"}>
                <SignedOutLanding />
            </Show>
            <Show when={"signed-in"}>
                <SignedInGate />
            </Show>
        </>
    );
}

function SignedOutLanding() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <p className="text-lg">
                    Bitte melden Sie sich an, um die App zu verwenden.
                </p>
                <SignInButton mode="modal">
                    <Button size="lg">Anmelden</Button>
                </SignInButton>
            </div>
        </div>
    );
}

function SignedInGate() {
    const hasOrg = useHasActiveOrg();
    const { user } = useUser();
    if (!hasOrg) {
        const memberships = user?.organizationMemberships ?? [];
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="flex flex-col items-center gap-6">
                    <h1 className="text-2xl font-semibold">
                        Wählen Sie eine Organisation
                    </h1>
                    {memberships.length > 0 ? (
                        <OrganizationList
                            hidePersonal
                            afterSelectOrganizationUrl="/app"
                        />
                    ) : (
                        <CreateOrganization afterCreateOrganizationUrl="/app" />
                    )}
                </div>
            </div>
        );
    }

    return <AppShell />;
}

function AppShell() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="my-auto mr-2 data-[orientation=vertical]:h-8"
                    />
                    <AppBreadcrumbs />
                </header>
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    );
}
