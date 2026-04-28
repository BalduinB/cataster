export const TREE_VITALITY = {
    0: "0 - Sehr gut",
    1: "1 - Gut",
    2: "2 - Eingeschränkt",
    3: "3 - Schwach",
    4: "4 - Kritisch",
} as const;

export type TreeVitality = keyof typeof TREE_VITALITY;

export const TREE_VITALITY_OPTIONS = Object.entries(TREE_VITALITY).map(
    ([value, label]) => ({ value, label }),
);

export const TREE_VITALITY_COLORS: Record<TreeVitality, string> = {
    0: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/30",
    1: "text-lime-700 bg-lime-100 dark:text-lime-300 dark:bg-lime-950/30",
    2: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/30",
    3: "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-950/30",
    4: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950/30",
};

export function getSpeciesDisplayName(
    species?: { deName: string; botanicalName: string } | null,
) {
    if (!species) {
        return "Unbekannte Art";
    }
    return `${species.deName} (${species.botanicalName})`;
}
