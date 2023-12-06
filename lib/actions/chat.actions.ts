"use server"

import Pusher from "pusher";
import { connectDb } from "../sql";
import util from 'util';
import { revalidatePath } from 'next/cache';

const pusher = new Pusher({
    //@ts-ignore
    appId: process.env.PUSHER_APP_ID,
    //@ts-ignore
    key: process.env.PUSHER_APP_KEY,
    //@ts-ignore
    secret: process.env.PUSHER_APP_SECRET,
    cluster: 'us2',
    useTLS: true,
  });

  export const sendMessage = async (text: string, sender: string, timestamp: string, receiver: string,  messages: any[], pathname: string) => {
    try {
      
      pusher.trigger("sparks", "message", { text, sender, receiver, timestamp});
      
      // Use a parameterized query to select a chat by sender and receiver IDs
      const connection = connectDb('spark');
      const queryAsync = util.promisify(connection.query).bind(connection);
  
      const query = 'SELECT * FROM chat WHERE sender_id = ? AND receiver_id = ?';
      //@ts-ignore
      const results: any[] = await queryAsync(query, [sender, receiver]);
  
      // If no chat exists, create a new one
      if (results.length === 0) {
        console.log('No Chat Found, Creating New Chat...');
        const insertQuery = 'INSERT INTO chat (sender_id, receiver_id, messages, read_status) VALUES (?, ?, ?, ?)';
  
        const insertValues = [sender, receiver, JSON.stringify(messages), false];
        //@ts-ignore
        const insertResults: any[] = await queryAsync(insertQuery, insertValues);
        console.log('Successfully Created Chat:', insertResults);
        revalidatePath(pathname)
        return true;
      } else {
        // If chat exists, update the messages column
        console.log('Chat Found:', results[0]);
        console.log('Updating Chat...');
        const updateQuery = 'UPDATE chat SET messages = ?, read_status = ? WHERE sender_id = ? AND receiver_id = ?';
        const updateValues = [JSON.stringify(messages), false, sender, receiver];
        //@ts-ignore
        const updateResults: any[] = await queryAsync(updateQuery, updateValues);
        console.log('Successfully Updated Chat:', updateResults);
        revalidatePath(pathname)
        return true;
      }
  
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  export const updateChatForOther = async ( sender: string, receiver: string, messages: any[], pathname: string) => {
    try{
     console.log("OTHER USER PROCESSING")
     // Use a parameterized query to select a chat by sender and receiver IDs
     const connection = connectDb('spark');
     const queryAsync = util.promisify(connection.query).bind(connection);
 
     const query = 'SELECT * FROM chat WHERE sender_id = ? AND receiver_id = ?';
     //@ts-ignore
     const results: any[] = await queryAsync(query, [sender, receiver]);
 
     // If no chat exists, create a new one
     if (results.length === 0) {
       console.log('No Chat Found, Creating New Chat...');
       const insertQuery = 'INSERT INTO chat (sender_id, receiver_id, messages, read_status) VALUES (?, ?, ?, ?)';
 
       const insertValues = [sender, receiver, JSON.stringify(messages), false];
       //@ts-ignore
       const insertResults: any[] = await queryAsync(insertQuery, insertValues);
       console.log('Successfully Created Chat:', insertResults);
       revalidatePath(pathname)
       return true;
     } else {
       // If chat exists, update the messages column
       console.log('Chat Found:', results[0]);
       console.log('Updating Chat...');
       const updateQuery = 'UPDATE chat SET messages = ?, read_status = ? WHERE sender_id = ? AND receiver_id = ?';
       const updateValues = [JSON.stringify(messages), false, sender, receiver];
       //@ts-ignore
       const updateResults: any[] = await queryAsync(updateQuery, updateValues);
       console.log('Successfully Updated Chat:', updateResults);
       revalidatePath(pathname)
       return true;
     }
 
   } catch (error) {
     console.log(error);
     return false;
   }
  }
  
  //Get Chats that belong to the User who is the Sender
  export const getChatsWithUsersByUserId = async (userId: string) => {
    try {
      // Use a parameterized query to select chats with user information
      const connection = connectDb('spark');
      const queryAsync = util.promisify(connection.query).bind(connection);
      
      const query = `
        SELECT
          chat.*,
          user.username AS user_username,
          user.name AS user_name,
          user.image AS user_image
        FROM
          chat
        JOIN
          user ON chat.receiver_id = user.id
        WHERE
          chat.sender_id = ?
      `;
      
      //@ts-ignore
      const results: any[] = await queryAsync(query, [userId]);
  
      // Close the database connection
      connection.end();
  
      console.log("User Chats with Users: ", results);
      return results;
    } catch (error) {
      console.log(error);
      return [];
    }
  };
  
  //Get Chat that fills the reciever UI chat
  export const getChatBySenderAndReceiver = async (senderId: string, receiverId: string) => {
    try {
      // Use a parameterized query to select a chat by both sender and receiver IDs
      const connection = connectDb('spark');
      const queryAsync = util.promisify(connection.query).bind(connection);
  
      const query = `
        SELECT
          chat.*,
          receiver.username AS receiver_username,
          receiver.name AS receiver_name,
          receiver.image AS receiver_image
        FROM
          chat
        JOIN
          user AS receiver ON chat.receiver_id = receiver.id
        WHERE
          chat.sender_id = ? AND chat.receiver_id = ?
      `;
  
      //@ts-ignore
      const result: any[] = await queryAsync(query, [senderId, receiverId]);
  
      // Close the database connection
      connection.end();
  
      console.log("Chat by Sender and Receiver: ", result);
      return result[0]; // Assuming there is only one chat for the given sender and receiver
    } catch (error) {
      console.log(error);
      return null;
    }
  };
  
  export const markChatAsRead = async (sender: string, receiver: string, messages: any[], pathname: string) => {
    try {
      console.log('Updating Chat with Read...');
      
      const connection = connectDb('spark');
      const queryAsync = util.promisify(connection.query).bind(connection);

      const updateQuery = 'UPDATE chat SET messages = ?, read_status = ? WHERE sender_id = ? AND receiver_id = ?';
      const updateValues = [JSON.stringify(messages), true, sender, receiver];
  
      // Emit an event to Pusher to notify the other user that the message has been read
      const updateData = { sender, receiver, messages, pathname};
      pusher.trigger('sparks', 'updateReadStatus', updateData);
  
      //@ts-ignore
      const updateResults: any[] = await queryAsync(updateQuery, updateValues);
      console.log('Successfully Updated Chat:', updateResults);
      revalidatePath(pathname);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };
  
  // Function to update the online status of the user
export const updateOnlineStatus = (userId: string, isOnline: boolean) => {
  try {
    console.log('Updating Online Status...');
    const updateData = { userId, isOnline };
    pusher.trigger('sparks', 'updateOnlineStatus', updateData);
    console.log('Successfully Updated Online Status:', updateData);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
