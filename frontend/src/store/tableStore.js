import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTableStore = create(
  persist(
    (set) => ({
      tableId: null,
      tableName: null,
      tableNumber: null,
      setTable: (tableId, tableName, tableNumber) => set({ tableId, tableName, tableNumber }),
      clearTable: () => set({ tableId: null, tableName: null, tableNumber: null }),
    }),
    {
      name: 'table-storage',
    }
  )
);

export default useTableStore;

