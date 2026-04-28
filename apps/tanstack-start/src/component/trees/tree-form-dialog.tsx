import { type ReactElement } from "react";

import type { LocationId, TreeDoc } from "@cataster/backend/types";
import { Button } from "@cataster/ui/components/base/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@cataster/ui/components/base/dialog";

import { TreeForm } from "./tree-form";

interface TreeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional trigger element. Pass `null` to use external state only. */
  trigger?: ReactElement | null;
  locationId: LocationId;
  tree: TreeDoc | null;
}

/**
 * Edit-only tree dialog. Reuses `TreeForm` in `edit` mode; the create path
 * lives on a dedicated route (see `routes/locations/$id/create-tree.tsx`)
 * because picking a position on the map needs more screen real estate than
 * a dialog can comfortably provide.
 */
export function TreeFormDialog({
  open,
  onOpenChange,
  locationId,
  tree,
  trigger = null,
}: TreeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {tree ? (
          <>
            <DialogHeader>
              <DialogTitle>Baum bearbeiten</DialogTitle>
              <DialogDescription>
                <span className="text-xs">
                  Position: {tree.latitude.toFixed(5)},{" "}
                  {tree.longitude.toFixed(5)}
                </span>
              </DialogDescription>
            </DialogHeader>
            <TreeForm
              mode="edit"
              locationId={locationId}
              treePosition={{ lat: tree.latitude, lng: tree.longitude }}
              tree={tree}
              onSuccess={() => onOpenChange(false)}
              renderFooter={({ form, isPending }) => (
                <DialogFooter className="mt-4">
                  <DialogClose render={<Button type="button" variant="ghost" />}>
                    Abbrechen
                  </DialogClose>
                  <form.AppForm>
                    <form.SubmitButton isLoading={isPending}>
                      Aktualisieren
                    </form.SubmitButton>
                  </form.AppForm>
                </DialogFooter>
              )}
            />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
