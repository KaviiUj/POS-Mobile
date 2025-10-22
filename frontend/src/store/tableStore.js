import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTableStore = create(
  persist(
    (set) => ({
      tableId: null,
      tableName: null,
      setTable: (tableId, tableName) => set({ tableId, tableName }),
      clearTable: () => set({ tableId: null, tableName: null }),
    }),
    {
      name: 'table-storage',
    }
  )
);

export default useTableStore;

