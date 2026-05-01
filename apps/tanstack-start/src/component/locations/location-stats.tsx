import { useMemo } from "react";
import {
    IconAlertTriangle,
    IconCalendarEvent,
    IconHeartbeat,
} from "@tabler/icons-react";

import type { TreeDoc } from "@cataster/backend/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@cataster/ui/components/base/card";
import { cn } from "@cataster/ui/lib/utils";

import type { TreeVitality } from "~/lib/tree-constants";
import { TREE_VITALITY, TREE_VITALITY_COLORS } from "~/lib/tree-constants";

interface LocationStatsProps {
    trees: ReadonlyArray<TreeDoc>;
}

const VITALITY_KEYS = [
    0, 1, 2, 3, 4,
] as const satisfies ReadonlyArray<TreeVitality>;

const VITALITY_BAR_COLORS: Record<TreeVitality, string> = {
    0: "bg-emerald-500",
    1: "bg-lime-500",
    2: "bg-amber-500",
    3: "bg-orange-500",
    4: "bg-red-500",
};

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

export function LocationStats({ trees }: LocationStatsProps) {
    const stats = useMemo(() => {
        const now = new Date();
        const today = startOfDay(now);
        const inOneWeek = new Date(today);
        inOneWeek.setDate(today.getDate() + 7);
        const inOneMonth = new Date(today);
        inOneMonth.setMonth(today.getMonth() + 1);

        let overdue = 0;
        let dueWeek = 0;
        let dueMonth = 0;
        const vitality: Record<TreeVitality, number> = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
        };

        for (const tree of trees) {
            const v = tree.vitality as TreeVitality;
            if (v in vitality) vitality[v] += 1;

            if (tree.nextControlAt) {
                const due = new Date(tree.nextControlAt);
                if (due < today) overdue += 1;
                else if (due <= inOneWeek) dueWeek += 1;
                else if (due <= inOneMonth) dueMonth += 1;
            }
        }

        return { overdue, dueWeek, dueMonth, vitality, total: trees.length };
    }, [trees]);

    return (
        <div className="col-span-full grid grid-cols-subgrid">
            <Card size="sm" className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <IconCalendarEvent className="size-5" />
                        Anstehende Kontrollen
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Geplante Kontrollen in den nächsten 30 Tagen
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <UpcomingSlot
                            label="Nächste Woche"
                            value={stats.dueWeek}
                            tone={stats.dueWeek > 0 ? "warning" : "muted"}
                        />
                        <UpcomingSlot
                            label="Nächster Monat"
                            value={stats.dueMonth}
                            tone="muted"
                        />
                        <UpcomingSlot
                            label="Überfällig"
                            value={stats.overdue}
                            tone={stats.overdue > 0 ? "danger" : "muted"}
                        />
                    </div>
                </CardContent>
            </Card>
            <Card size="sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <IconHeartbeat className="size-5" />
                        Vitalität
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {stats.total} Bäume gesamt
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <VitalityBreakdown
                        counts={stats.vitality}
                        total={stats.total}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

const TONE_STYLES = {
    muted: "text-muted-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
} as const;

function KpiCard({
    icon,
    title,
    value,
    description,
    tone,
}: {
    icon: React.ReactNode;
    title: string;
    value: number;
    description: string;
    tone: keyof typeof TONE_STYLES;
}) {
    return (
        <Card size="sm">
            <CardHeader>
                <CardTitle
                    className={cn(
                        "flex items-center gap-2 text-sm",
                        TONE_STYLES[tone],
                    )}
                >
                    {icon}
                    {title}
                </CardTitle>
                <CardDescription className="text-xs">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    className={cn(
                        "font-heading text-3xl font-semibold tabular-nums",
                        TONE_STYLES[tone],
                    )}
                >
                    {value}
                </div>
            </CardContent>
        </Card>
    );
}

function UpcomingSlot({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: keyof typeof TONE_STYLES;
}) {
    return (
        <div className="space-y-0.5">
            <div
                className={cn(
                    "font-heading text-2xl font-semibold tabular-nums",
                    TONE_STYLES[tone],
                )}
            >
                {value}
            </div>
            <div className="text-muted-foreground text-xs">{label}</div>
        </div>
    );
}

function VitalityBreakdown({
    counts,
    total,
}: {
    counts: Record<TreeVitality, number>;
    total: number;
}) {
    if (total === 0) {
        return (
            <p className="text-muted-foreground text-xs">
                Noch keine Bäume erfasst.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            <div className="bg-muted flex h-2 w-full overflow-hidden rounded-full">
                {VITALITY_KEYS.map((v) => {
                    const pct = (counts[v] / total) * 100;
                    if (pct === 0) return null;
                    return (
                        <div
                            key={v}
                            className={VITALITY_BAR_COLORS[v]}
                            style={{ width: `${pct}%` }}
                            title={`${TREE_VITALITY[v]}: ${counts[v]}`}
                        />
                    );
                })}
            </div>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                {VITALITY_KEYS.map((v) => (
                    <li
                        key={v}
                        className="flex items-center justify-between gap-2"
                    >
                        <span className="flex items-center gap-1.5 truncate">
                            <span
                                className={cn(
                                    "inline-block size-2 rounded-full",
                                    VITALITY_BAR_COLORS[v],
                                )}
                                aria-hidden
                            />
                            <span
                                className={cn(
                                    "truncate",
                                    TREE_VITALITY_COLORS[v],
                                    "rounded px-1",
                                )}
                            >
                                {TREE_VITALITY[v]}
                            </span>
                        </span>
                        <span className="font-medium tabular-nums">
                            {counts[v]}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
