"use server"
import {connectDb} from '@/lib/sql'
import { revalidatePath } from 'next/cache';

import util from 'util';

export const getUsers = async () => {
  return new Promise(async (resolve, reject) => {
    try {

      // Connect to the database (parameter is name of the schema/database to connect)
      const connection = connectDb("spark");

      //execute the query
      connection.query('SELECT * FROM user', (error, results, fields) => {
        if (error) {
          console.error('Error executing query:', error);
          reject(error); // Reject the promise on error
        } else {
          console.log(results)
          // Convert the results to a JSON string
          //const resultsString = JSON.stringify(results);
          connection.end();
          // Close the connection
          resolve(results); // Resolve the promise with the results
        }
      });
    } catch (error) {
      console.error('Error:', error);
      reject(error); // Reject the promise on error
    }
  });
};

export const fetchUser = async (userId: string): Promise<any> => {
  try {
    const connection = connectDb('spark'); // returns a Connection
    // Promisify connection.query
    const queryAsync = util.promisify(connection.query).bind(connection);
    // Use a parameterized query to select a user by their ID
    const query = `SELECT * FROM user WHERE id = ?`;
    //@ts-ignore
    const results: any[] = await queryAsync(query, [userId]);
    connection.end();

    if (results.length === 0) {
      throw new Error('User Not Found');
    }
    // Assuming results[0] is the user data, you should replace 'any' with the actual user type
    return results[0];
    
  } catch (error: any) {
    console.log("Error", error)
    return ""
  }
};

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export const updateOrCreateUser = async (
  {
    userId,
    bio,
    name,
    path,
    username,
    image
  }: Params
) => {
  try{
   const connection = connectDb('spark');
   // Promisify connection.query
   const queryAsync = util.promisify(connection.query).bind(connection);
   // Use a parameterized query to select a user by their ID
   const query = `SELECT * FROM user WHERE id = ?`;

   //@ts-ignore
   const results: any[] = await queryAsync(query, [userId]);
   connection.end();

   const onboarded = 1;
   //If No User exists Create a new one
   if (results.length === 0) {
     console.log('No User was Found, Creating New User...');
     const connection = connectDb('spark');
     const queryAsync = util.promisify(connection.query).bind(connection);
     const insertQuery = 'INSERT INTO user (id, username, name, bio, image, onboarded) VALUES (?, ?, ?, ?, ?, ?)';
     const insertValues = [userId, username, name, bio, image, onboarded]
     //@ts-ignore
     const insertResults: any[] = await queryAsync(insertQuery, insertValues);
     console.log("Successfully Created User: " , insertResults)
     return true;
   }//If User Exists then Update it
   else{
    console.log("User Found:", results[0])
    console.log("Updating....")
    const connection = connectDb('spark');
    const queryAsync = util.promisify(connection.query).bind(connection);
    const updateQuery = 'UPDATE user SET username = ?, name = ?, bio = ?, image = ?, onboarded = ? WHERE id = ?';
    const updateValues = [username, name, bio, image, onboarded, userId]
    //@ts-ignore
    const updateResults: any[] = await queryAsync(updateQuery, updateValues);
    console.log("Successfully Updated User: " , updateResults)
    if (path === "/profile/edit") {
      revalidatePath(path);
    }
    return true;
   }
  }catch(error){
    console.log(`Error Upating or Creating User in Database: ${error}`);
    return false;
  }
}