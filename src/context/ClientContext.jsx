import { createContext, useContext, useState, useMemo } from 'react';
import { getDefaultClient } from '../data/clients';

const ClientContext = createContext();

export const ClientProvider = ({ children, initialClientId = null }) => {
  const [currentClient, setCurrentClient] = useState(() => {
    if (initialClientId) {
      const { getClientById } = require('../data/clients');
      return getClientById(initialClientId) || getDefaultClient();
    }
    return getDefaultClient();
  });

  const value = useMemo(() => ({
    currentClient,
    setCurrentClient,
    clientId: currentClient.id,
    clientName: currentClient.name,
    establishments: currentClient.establishments
  }), [currentClient]);

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within ClientProvider');
  }
  return context;
};
