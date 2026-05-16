import { toast } from "sonner";

import { isWireError } from "@cataster/validators";

import { decodeWireErrorFromUnknown } from "./confect";

/**
 * Map a thrown mutation/action error onto a toast.
 *
 * If the error is a shared wire-level Confect error (`Unauthorized`, `Conflict`,
 * `NotFound`, `Forbidden`), use its `message` directly. Otherwise fall back
 * to the supplied generic message — opaque server defects shouldn't leak
 * raw text to the UI.
 */
export function toastConfectError(fallback: string, error: unknown) {
    const decoded = isWireError(error)
        ? error
        : decodeWireErrorFromUnknown(error);
    if (decoded) {
        toast.error(decoded.message);
        return;
    }
    toast.error(fallback);
}
