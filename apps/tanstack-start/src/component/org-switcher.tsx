import * as React from "react";
import {
    CreateOrganization,
    useOrganization,
    useOrganizationList,
} from "@clerk/tanstack-react-start";
import {
    IconBuilding,
    IconChevronCompactRight,
    IconPlus,
} from "@tabler/icons-react";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@cataster/ui/components/base/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@cataster/ui/components/base/dialog";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@cataster/ui/components/base/dropdown-menu";
import { SidebarMenuButton } from "@cataster/ui/components/base/sidebar";
import { Skeleton } from "@cataster/ui/components/base/skeleton";
import { useIsMobile } from "@cataster/ui/hooks/use-mobile";

/**
 * Custom replacement for Clerk's `<OrganizationSwitcher>` that fits the app's
 * shadcn sidebar styling. Lists the user's organization memberships, marks the
 * active one, and lets the user switch via Clerk's `setActive`. A "Create
 * organization" entry opens Clerk's `<CreateOrganization>` flow in a dialog.
 *
 * Expected to be rendered inside a `SidebarMenuItem` (see `AppSidebar`).
 */
export function OrgSwitcher() {
    const isMobile = useIsMobile();
    const { organization, isLoaded: orgLoaded } = useOrganization();
    const {
        isLoaded: listLoaded,
        userMemberships,
        setActive,
    } = useOrganizationList({
        userMemberships: { infinite: true },
    });
    const [createOpen, setCreateOpen] = React.useState(false);

    if (!orgLoaded || !listLoaded) {
        return (
            <SidebarMenuButton size="lg" disabled>
                <Skeleton className="size-8 rounded-md" />
                <div className="grid flex-1 gap-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </SidebarMenuButton>
        );
    }

    const memberships = userMemberships.data ?? [];

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="rounded-md">
                                <AvatarImage
                                    src={organization?.imageUrl}
                                    alt={organization?.name ?? "Organisation"}
                                />
                                <AvatarFallback className="rounded-md">
                                    {organization?.name?.charAt(0) ?? (
                                        <IconBuilding className="size-4" />
                                    )}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {organization?.name ?? "Keine Organisation"}
                                </span>
                                <span className="text-muted-foreground truncate text-xs">
                                    {organization?.membersCount != null
                                        ? `${organization.membersCount} Mitglieder`
                                        : "Organisation wechseln"}
                                </span>
                            </div>
                            <IconChevronCompactRight className="ml-auto" />
                        </SidebarMenuButton>
                    }
                />
                <DropdownMenuContent
                    className="w-(--radix-dropdown-menu-trigger-width) min-w-64"
                    side={isMobile ? "bottom" : "right"}
                    align="start"
                    sideOffset={4}
                >
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>Organisationen</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                            value={organization?.id}
                            onValueChange={(value) => {
                                void setActive({
                                    organization: value,
                                });
                            }}
                        >
                            {memberships.length === 0 ? (
                                <DropdownMenuItem disabled>
                                    Keine Organisationen
                                </DropdownMenuItem>
                            ) : (
                                memberships.map(({ organization }) => {
                                    return (
                                        <DropdownMenuRadioItem
                                            value={organization.id}
                                            key={organization.id}
                                        >
                                            <Avatar className="size-6">
                                                <AvatarImage
                                                    src={organization.imageUrl}
                                                    alt={organization.name}
                                                />
                                                <AvatarFallback className="text-xs">
                                                    {organization.name.charAt(
                                                        0,
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">
                                                {organization.name}
                                            </span>
                                        </DropdownMenuRadioItem>
                                    );
                                })
                            )}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() => {
                                console.log("create");
                                setCreateOpen(true);
                            }}
                            onSelect={() => {
                                console.log("create");
                                setCreateOpen(true);
                            }}
                        >
                            <IconPlus />
                            Organisation erstellen
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="w-auto max-w-fit border-none bg-transparent p-0 shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Organisation erstellen</DialogTitle>
                    </DialogHeader>
                    <CreateOrganization
                        skipInvitationScreen
                        afterCreateOrganizationUrl="/app"
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
