"use server"
import {connectDb} from '@/lib/sql'
import { revalidatePath } from 'next/cache';

import util from 'util';

export const createPost = async ({text,author,path} : {text: string, author: string, path: string}) => {
    function getDate() {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(currentDate.getDate()).padStart(2, '0');
      
        // Combine the date components into a string with the desired format (e.g., "YYYY-MM-DD")
        return `${year}-${month}-${day}`;
      }
    
    try{
    
        const connection = connectDb('spark');
        // Promisify connection.query
        const queryAsync = util.promisify(connection.query).bind(connection);
        const insertQuery = 'INSERT INTO post (content, title, author_id, created_at) VALUES (?, ?, ?, ?)';
        const insertValues = [text, "Regular Post", author, getDate() ]
        //@ts-ignore
        const insertResults: any[] = await queryAsync(insertQuery, insertValues);
        console.log("Successfully Created Post: " , insertResults)

    }catch(error)
    {
        console.log("Error: " , error)
    }
}

export const fetchPosts = async (pageNumber = 1, pageSize = 20) => {
    try {
        // Establish a database connection
        const connection = connectDb('spark');
    
        // Promisify connection.query
        const queryAsync = util.promisify(connection.query).bind(connection);
    
        // Calculate the number of posts to skip based on the page number and page size.
        const skipAmount = (pageNumber - 1) * pageSize;
    
        // Define the SQL query to fetch top-level posts with related data
        const selectQuery = `
          SELECT
            P.*,
            U.username AS author_username,
            U.image AS author_image,
            (
              SELECT COUNT(*)
              FROM post AS C
              WHERE C.parent_id = P.idpost
            ) AS children_count
          FROM
            post AS P
          LEFT JOIN
            user AS U ON P.author_id = U.id
          WHERE
            P.parent_id IS NULL
          ORDER BY
            P.created_at DESC
          LIMIT
            ?, ?;
        `;
    
        // Define query parameters
        const selectValues = [skipAmount, pageSize];
    
        // Execute the SQL query to fetch top-level posts
        //@ts-ignore
        const results = await queryAsync(selectQuery, selectValues);
    
        // Close the database connection
        connection.end();
    
        console.log("Success Getting Posts: ", results)
        return results;
      } catch (error) {
        console.log('Error:', error);
        throw new Error('Failed to fetch top-level posts');
      }
    };

