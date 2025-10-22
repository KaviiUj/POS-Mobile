import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useOutletStore = create(
  persist(
    (set) => ({
      logo: null,
      showCuisineFilter: false,
      showModifiers: false,
      showModifiersPrice: false,
      outletName: null,
      outletCurrency: null,
      createdAt: null,
      updatedAt: null,
      setOutletConfig: (config) => 
        set({
          logo: config.logo,
          showCuisineFilter: config.showCuisineFilter,
          showModifiers: config.showModifiers,
          showModifiersPrice: config.showModifiersPrice,
          outletName: config.outletName,
          outletCurrency: config.outletCurrency,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        }),
      clearOutletConfig: () => 
        set({
          logo: null,
          showCuisineFilter: false,
          showModifiers: false,
          showModifiersPrice: false,
          outletName: null,
          outletCurrency: null,
          createdAt: null,
          updatedAt: null,
        }),
    }),
    {
      name: 'outlet-storage',
    }
  )
);

export default useOutletStore;

