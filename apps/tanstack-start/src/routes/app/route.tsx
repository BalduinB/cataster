import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Separator } from "@cataster/ui/components/base/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@cataster/ui/components/base/sidebar";

import { AppSidebar } from "~/component/app-sidebar";
import { AppBreadcrumbs } from "~/component/breadcrumb";

export const Route = createFileRoute("/app")({
    component: RouteComponent,
});

function RouteComponent() {
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
