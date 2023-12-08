// Import necessary React modules

"use client"
import React, { createContext, useContext, ReactNode, useState } from 'react';

// Define the types for the context
type AppContextProps = {
  // Define your state and methods here
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  // Add additional states here
  globalMessages: any[];
  setGlobalMessages: React.Dispatch<React.SetStateAction<any>>;

  readMessages: any;
  setReadMessages: React.Dispatch<React.SetStateAction<any>>;

};

// Create the AppContext with an initial value of undefined
const AppContext = createContext<AppContextProps | undefined>(undefined);

// Create the AppProvider component that will wrap your application
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize the user state using the useState hook
  const [user, setUser] = useState<any>("test");

  // Add additional states using the useState hook
  const [globalMessages, setGlobalMessages] = useState([]);

  const [readMessages, setReadMessages] = useState(false)

  // Provide the context value to the children components , include addtional states if there is
  return <AppContext.Provider value={{ user, setUser, globalMessages, setGlobalMessages, readMessages, setReadMessages }}>{children}</AppContext.Provider>;
};

// Create a custom hook (useAppContext) to easily access the context
export const useAppContext = () => {
  // Use the useContext hook to access the AppContext
  const context = useContext(AppContext);

  // Throw an error if the hook is not used within an AppProvider
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }

  // Return the context value
  return context;
};
