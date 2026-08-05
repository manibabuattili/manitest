import { create } from "zustand";

type SupportUiState = {
  selectedTicketIds: string[];
  toggleTicket: (id: string) => void;
  clearSelection: () => void;
};

export const useSupportUiStore = create<SupportUiState>((set) => ({
  selectedTicketIds: [],
  toggleTicket: (id) =>
    set((state) => ({
      selectedTicketIds: state.selectedTicketIds.includes(id)
        ? state.selectedTicketIds.filter((x) => x !== id)
        : [...state.selectedTicketIds, id],
    })),
  clearSelection: () => set({ selectedTicketIds: [] }),
}));
