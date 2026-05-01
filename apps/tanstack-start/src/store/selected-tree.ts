import { create } from "zustand";

import type { TreeId } from "@cataster/backend/types";

interface SelectedTreeState {
    selectedTreeId: TreeId | null;
    setSelectedTreeId: (id: TreeId | null) => void;
}

export const useSelectedTree = create<SelectedTreeState>((set) => ({
    selectedTreeId: null,
    setSelectedTreeId: (id) => set({ selectedTreeId: id }),
}));
