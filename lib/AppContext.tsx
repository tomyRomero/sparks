"use client"

// Import necessary React modules
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import pusherClient from './pusher';
import { getClerkUser } from './actions/user.actions';
import { updateOnlineStatus } from './actions/chat.actions';

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

  userId: any;
  setUserId: React.Dispatch<React.SetStateAction<any>>;
};

// Create the AppContext with an initial value of undefined
const AppContext = createContext<AppContextProps | undefined>(undefined);

// Create the AppProvider component that will wrap your application
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize the user state using the useState hook
  const [user, setUser] = useState<any>("test");

  // Add additional states using the useState hook

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

  const [userId, setUserId] = useState("");

  //Client Pusher Instance Logic
  const pusher = pusherClient;
  const [pusherChannel, setPusherChannel] = useState(pusher.subscribe('sparks'));

  //If User Is inActvie for more than 15 mins, close the connection to Pusher

  // Set the timeout duration in milliseconds (e.g., 15 minutes)
  const timeoutDuration = 15 * 60 * 1000; // 15 minutes

  // Create a variable to hold the timeout ID
  let timeoutId: NodeJS.Timeout | undefined;

  // Function to handle user activity
  const handleUserActivity = () => {
    // Clear the existing timeout (if any)
    clearTimeout(timeoutId);

    // Reset the timeout
    timeoutId = setTimeout(() => {
      // Unsubscribe from the Pusher channel after the timeout
      pusherChannel.unsubscribe();
      console.log('Pusher channel unsubscribed due to inactivity.');
    }, timeoutDuration);
  };

  // Provide the context value to the children components, include additional states if there are any
  const contextValue: AppContextProps = {
    user,
    setUser,
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
    userId, setUserId
  };

  // Set up event listeners for user activity (adjust as needed based on your application)
  useEffect(() => {
    // Example: Listen for mouse move events
    window.addEventListener('mousemove', handleUserActivity);

    // Example: Listen for keyboard events
    window.addEventListener('keydown', handleUserActivity);

    // Clear the timeout when the component unmounts
    return () => clearTimeout(timeoutId);
  }, [timeoutId]);

  useEffect(()=> {
    const getId = async ()=> {
      const id = await getClerkUser();

      if(id)
      {
        setUserId(id)
        updateOnlineStatus(id, true)
      }
    }

    getId();
  })

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
