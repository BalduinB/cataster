import { differenceInDays } from "date-fns";

export function formatControlDate(date: Date) {
    const dUntil = differenceInDays(date, new Date());
    if (dUntil === 0) {
        return "Heute";
    }
    if (dUntil === 1) {
        return "Morgen";
    }
    if (dUntil === -1) {
        return "Gestern";
    }
    return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}
