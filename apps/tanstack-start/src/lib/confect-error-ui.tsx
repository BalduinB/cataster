import type { WireError } from "@cataster/validators";
import { isWireError } from "@cataster/validators";

import { decodeWireErrorFromUnknown } from "./confect";

export function getWireError(error: unknown): WireError | null {
    if (isWireError(error)) return error;
    return decodeWireErrorFromUnknown(error);
}

export function wireErrorMessage(error: WireError): string {
    switch (error._tag) {
        case "Unauthorized":
            return "Bitte melde dich an, um fortzufahren.";
        case "Forbidden":
            return error.message || "Keine Berechtigung für diese Aktion.";
        case "NotFound":
            return error.message || "Nicht gefunden.";
        case "Conflict":
            return error.message;
    }
}
