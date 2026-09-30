"use client"

// Import necessary React modules
import React, { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import pusherClient from './pusher';

// Define the types for the context
type AppContextProps = {
  // Define state and methods here
  globalMessages: any[];
  setGlobalMessages: React.Dispatch<React.SetStateAction<any>>;

  readMessages: any;
  setReadMessages: React.Dispatch<React.SetStateAction<any>>;

  pusherChannel: any;
  setPusherChannel: React.Dispatch<React.SetStateAction<any>>;

  newComment: any;
  setNewComment: React.Dispatch<React.SetStateAction<any>>;

  newLike: any;
  setNewLike: React.Dispatch<React.SetStateAction<any>>;

  readActivity: any;
  setReadActivity:  React.Dispatch<React.SetStateAction<any>>;

  title: any;
  setTitle: React.Dispatch<React.SetStateAction<any>>;

  messageNoti: any;
  setMessageNoti:  React.Dispatch<React.SetStateAction<any>>;

  activityNoti: any;
  setActivityNoti: React.Dispatch<React.SetStateAction<any>>;

};

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// Create the AppContext with an initial value of undefined
const AppContext = createContext<AppContextProps | undefined>(undefined);

// Create the AppProvider component that will wrap your application
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize the state using the useState hook
  //For when there is a new text message, activate all listening components
  const [globalMessages, setGlobalMessages] = useState([]);

  //For when a message is read, activate all listening components
  const [readMessages, setReadMessages] = useState(false);

  //For when there is a new comment activate all listening components
  const [newComment, setNewComment] = useState(false);

  //For when there is a new like activate all listening components
  const [newLike, setNewLike] = useState(false);

  //For when an acitivty notifcation has been read
  const [readActivity, setReadActivity] = useState(false)

  //For filtering Pagination
  const [title, setTitle] = useState("");

  //For global message notifcation
  const [messageNoti, setMessageNoti] = useState(false)

  //For global activity notifcation
  const [activityNoti, setActivityNoti] = useState(false);

  //Client Pusher Instance Logic
  const pusher = pusherClient;
  const [pusherChannel, setPusherChannel] = useState(pusher.subscribe('sparks'));

  //If User Is inActvie for more than 15 mins, close the connection to Pusher.
  // A ref keeps the timer across renders; a plain variable was reset on every render.
  const timeoutId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Provide the context value to the children components, include additional states if there are any
  const contextValue: AppContextProps = {
    globalMessages,
    setGlobalMessages,
    readMessages,
    setReadMessages,
    pusherChannel,
    setPusherChannel,
    newComment, 
    setNewComment,
    newLike, setNewLike,
    setReadActivity, readActivity,
    setTitle, title,
    messageNoti, setMessageNoti,
    activityNoti, setActivityNoti,
  };

  // Any mouse or keyboard activity restarts the inactivity timer.
  useEffect(() => {
    const handleUserActivity = () => {
      clearTimeout(timeoutId.current);
      timeoutId.current = setTimeout(() => {
        pusherChannel.unsubscribe();
        console.log('Pusher channel unsubscribed due to inactivity.');
      }, INACTIVITY_TIMEOUT_MS);
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    // Remove the listeners too, so they don't pile up.
    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      clearTimeout(timeoutId.current);
    };
  }, [pusherChannel]);

 

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
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
