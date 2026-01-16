import { create } from "zustand";
import { persist } from "zustand/middleware";

type BallotUiState = {
  isManageMode: boolean;
  selectedIds: number[];

  toggleManageMode: () => void;
  setManageMode: (v: boolean) => void;

  toggleId: (id: number) => void;
  setSelectedIds: (ids: number[]) => void;
  clearSelection: () => void;
  selectAll: (ids: number[]) => void;
};

export const useBallotStore = create<BallotUiState>()(
  persist(
    (set) => ({
      isManageMode: false,
      selectedIds: [],

      toggleManageMode: () =>
        set((state) => ({
          isManageMode: !state.isManageMode,
          selectedIds: state.isManageMode ? [] : state.selectedIds,
        })),

      setManageMode: (v) =>
        set(() => ({
          isManageMode: v,
          selectedIds: v ? [] : [],
        })),

      toggleId: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((x) => x !== id)
            : [...state.selectedIds, id],
        })),

      setSelectedIds: (ids) => set({ selectedIds: ids }),

      clearSelection: () => set({ selectedIds: [] }),

      selectAll: (ids) => set({ selectedIds: ids }),
    }),
    {
      name: "ballot-ui-state",
      partialize: (state) => ({
        // ✅ only persist manage mode, NOT selection
        isManageMode: state.isManageMode,
      }),
    }
  )
);
