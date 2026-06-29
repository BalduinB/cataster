import { IconLayoutDashboard } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@cataster/ui/components/base/empty";

export const Route = createFileRoute("/app/")({
    staticData: {
        nav: {
            title: "Dashboard",
            icon: IconLayoutDashboard,
        },
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex grow items-center justify-center">
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <IconLayoutDashboard />
                    </EmptyMedia>
                    <EmptyTitle>Dashboard</EmptyTitle>
                    <EmptyDescription>
                        Hier gibt es noch nichts zu sehen.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        </div>
    );
}
