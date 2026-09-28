/**
 * API Integration Context Provider
 * Provides backend API connection to all child components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useApiIntegration } from '../hooks/useApiIntegration';

// Create the context
const ApiIntegrationContext = createContext<ReturnType<typeof useApiIntegration> | null>(null);

// Provider component
interface ApiIntegrationProviderProps {
  children: ReactNode;
  
}

export const ApiIntegrationProvider: React.FC<ApiIntegrationProviderProps> = ({ children }) => {
  const apiIntegration = useApiIntegration();

  return (
    <ApiIntegrationContext.Provider value={apiIntegration}>
      {children}
    </ApiIntegrationContext.Provider>
  );
};

// Custom hook to use the API integration context
export const useApiContext = () => {
  const context = useContext(ApiIntegrationContext);
  if (!context) {
    throw new Error('useApiContext must be used within an ApiIntegrationProvider');
  }
  return context;
};

// Export types for components
export type ApiIntegrationType = ReturnType<typeof useApiIntegration>;
export type ConnectionStatus = 'connected' | 'disconnected' | 'checking';
