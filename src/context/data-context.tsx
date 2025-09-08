"use client";
import React, { createContext, useContext, ReactNode } from 'react';
// This context is no longer needed as each component will fetch its own data.
// This simplifies the data flow and ensures components are self-contained.
// Keeping the file for now to avoid breaking imports, but it's effectively empty.

interface DataContextType {
  // Define the shape of your context data here
  // For example:
  // sales: any[];
  // loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  // The value provided to the context consumers
  const value = {
    // Populate your context value here
  };

  return (
    <DataContext.Provider value={value as any}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    // This can be a silent failure or a logged error, depending on desired strictness.
    // console.warn('useData must be used within a DataProvider');
    return { allSales: [], allExpenses: [], allDebts: [], allWorkers: [], loading: true }; // Return a default empty state
  }
  return context;
};
