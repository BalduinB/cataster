import * as React from "react";
import { OrganizationSwitcher, useUser } from "@clerk/tanstack-react-start";
import {
    IconBadge,
    IconBell,
    IconChevronCompactLeft,
    IconChevronCompactRight,
    IconCreditCard,
    IconDots,
    IconLogout,
    IconSparkles,
    IconTree,
} from "@tabler/icons-react";
import { Link, useMatchRoute, useRouter } from "@tanstack/react-router";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@cataster/ui/components/base/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@cataster/ui/components/base/dropdown-menu";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@cataster/ui/components/base/sidebar";
import { useIsMobile } from "@cataster/ui/hooks/use-mobile";

import type { NavGroup, NavStaticData } from "~/router";
import { PARAM_PLACEHOLDER } from "~/router";

/**
 * Display labels for sidebar groups. Single source of truth for renaming
 * groups — `NavGroup` (in `router.tsx`) declares which keys are valid, and
 * `Record<NavGroup, string>` makes labels mandatory.
 */
const groupLabelMap: Record<NavGroup, string> = {
    general: "Allgemein",
    data: "Daten",
};

type NavLink = Omit<NavStaticData, "group" | "parent"> & { to: string };
type TopLevelNavItem = NavLink & { children: NavLink[] };

/**
 * Replace dynamic-param segments (e.g. `$id`) with the placeholder so that
 * sub-nav links to dynamic routes are navigable without picking a value first;
 * the layout matches on the placeholder and renders a picker.
 */
function resolveDynamicPath(fullPath: string): string {
    return fullPath.replace(/\$\w+/g, PARAM_PLACEHOLDER);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const router = useRouter();
    const matchRoute = useMatchRoute();

    const itemsByGroup = React.useMemo(() => {
        const buckets: Record<NavGroup | "top-level", TopLevelNavItem[]> = {
            general: [],
            data: [],
            "top-level": [],
        };
        const byPath = new Map<string, TopLevelNavItem>();

        // Pass 1: collect top-level items so children can find their parent.
        for (const route of router.flatRoutes) {
            const nav = route.options.staticData?.nav;
            if (!nav || nav.parent !== undefined) continue;
            const item: TopLevelNavItem = {
                title: nav.title,
                icon: nav.icon,
                to: route.fullPath,
                children: [],
            };
            buckets[nav.group ?? "top-level"].push(item);
            byPath.set(route.fullPath, item);
        }

        // Pass 2: attach sub-navs to their parent (silently dropped if the
        // referenced parent has no `nav` of its own).
        for (const route of router.flatRoutes) {
            const nav = route.options.staticData?.nav;
            if (!nav || nav.parent === undefined) continue;
            const parent = byPath.get(nav.parent);
            if (!parent) continue;
            parent.children.push({
                title: nav.title,
                icon: nav.icon,
                to: resolveDynamicPath(route.fullPath),
            });
        }
        return buckets;
    }, [router.flatRoutes]);

    return (
        <Sidebar variant="floating" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            render={<Link to="/app" />}
                        >
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-md">
                                <IconTree className="size-4" />
                            </div>
                            <div className="flex flex-col gap-0.5 leading-none">
                                <span className="font-medium">
                                    Documentation
                                </span>
                                <span className="">v1.0.0</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {itemsByGroup["top-level"].length > 0 ? (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {itemsByGroup["top-level"].map((item) => (
                                    <NavMenuItem
                                        key={item.to}
                                        item={item}
                                        isActive={false}
                                    />
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ) : null}
                {(Object.keys(groupLabelMap) as NavGroup[]).map((group) => {
                    const items = itemsByGroup[group];
                    if (items.length === 0) return null;
                    return (
                        <SidebarGroup key={group}>
                            <SidebarGroupLabel>
                                {groupLabelMap[group]}
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {items.map((item) => (
                                        <NavMenuItem
                                            key={item.to}
                                            item={item}
                                            isActive={
                                                !!matchRoute({
                                                    to: item.to as never,
                                                    fuzzy: !item.to.endsWith(
                                                        "/",
                                                    ),
                                                })
                                            }
                                        />
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    );
                })}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

function NavMenuItem({
    item,
    isActive,
}: {
    item: TopLevelNavItem;
    isActive: boolean;
}) {
    const Icon = item.icon;
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                isActive={isActive}
                tooltip={item.title}
                render={<Link to={item.to as never} />}
            >
                {Icon ? <Icon /> : null}
                <span>{item.title}</span>
            </SidebarMenuButton>
            {item.children.length > 0 ? (
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <SidebarMenuAction
                                showOnHover
                                aria-label={`Mehr Aktionen für ${item.title}`}
                            >
                                <IconDots />
                            </SidebarMenuAction>
                        }
                    />
                    <DropdownMenuContent side="right" align="start">
                        {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                                <DropdownMenuItem
                                    key={child.to}
                                    render={<Link to={child.to as never} />}
                                >
                                    {ChildIcon ? <ChildIcon /> : null}
                                    <span>{child.title}</span>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}
        </SidebarMenuItem>
    );
}

function NavUser() {
    const isMobile = useIsMobile();
    const { user } = useUser();
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <Avatar>
                                    <AvatarImage alt="User" />
                                    <AvatarFallback>
                                        {user?.firstName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {user?.firstName} {user?.lastName}
                                    </span>
                                    <span className="truncate text-xs">
                                        {user?.emailAddresses[0]?.emailAddress}
                                    </span>
                                </div>
                                <IconChevronCompactRight />
                            </SidebarMenuButton>
                        }
                    />
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar>
                                        <AvatarImage
                                            src={user?.imageUrl}
                                            alt={user?.firstName ?? ""}
                                        />
                                        <AvatarFallback>
                                            {user?.firstName?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">
                                            {user?.firstName} {user?.lastName}
                                        </span>
                                        <span className="truncate text-xs">
                                            {
                                                user?.emailAddresses[0]
                                                    ?.emailAddress
                                            }
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <IconSparkles />
                                Upgrade to Pro
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <IconBadge />
                                Account
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <IconCreditCard />
                                Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <IconBell />
                                Notifications
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <IconLogout />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
