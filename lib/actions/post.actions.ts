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
    const connection = connectDb('spark'); // Replace 'spark' with your database name
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
    const results: any = await queryAsync(selectQuery, selectValues);

    // Format children for each post
    for (const post of results) {
      // Fetch and format post's children
      if (post.children_count > 0) {
        const childrenIds = post.children.split(',').filter(Boolean); // Split the comma-separated string
        const childrenQuery = 'SELECT * FROM post WHERE idpost IN (?)';
        //@ts-ignore
        const childrenPosts: any = await queryAsync(childrenQuery, [childrenIds]);

        if (childrenPosts.length > 0) {
          post.children = childrenPosts;
        } else {
          post.children = [];
        }
      } else {
        post.children = [];
      }
    }

    // Close the database connection
    connection.end();

    return results;
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Failed to fetch top-level posts');
  }
};

export const fetchPostById = async (postId :string) => {
  try {
    const connection = connectDb('spark'); // Replace 'spark' with your database name
    const queryAsync = util.promisify(connection.query).bind(connection);

    // Fetch the post by its ID
    const selectQuery = 'SELECT * FROM post WHERE idpost = ?';
    //@ts-ignore
    const posts:any = await queryAsync(selectQuery, [postId]);

    if (posts.length === 0) {
      // Post not found
      connection.end();
      return null;
    }

    const post = posts[0];

    // Fetch post author by author_id
    const authorQuery = 'SELECT id, id, username, name, image FROM user WHERE id = ?';
    //@ts-ignore
    const authorResults: any = await queryAsync(authorQuery, [post.author_id]);

    if (authorResults.length > 0) {
      post.author = authorResults[0];
    }

    // Fetch post's children
    if (post.children) {
      const childrenIds= post.children.split(',').filter(Boolean);
      const childrenQuery = 'SELECT * FROM post WHERE idpost IN (?)';
      //@ts-ignore
      const childrenPosts: any = await queryAsync(childrenQuery, [childrenIds]);

      if (childrenPosts.length > 0) {
        post.children = childrenPosts;
      }
    }

    // Close the database connection
    connection.end();

    return post;
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Unable to fetch post');
  }
};


export const addCommentToPost = async (postId: string, commentText: string, userId: string, path: any, currentUserImg : string) => {
  function getDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');

    // Combine the date components into a string with the desired format (e.g., "YYYY-MM-DD")
    return `${year}-${month}-${day}`;
  }

  try {
    const connection = connectDb('spark'); // Replace 'spark' with your database name
    const queryAsync = util.promisify(connection.query).bind(connection);

    // Find the original post by its ID
    const selectQuery = 'SELECT * FROM post WHERE idpost = ?';

    //@ts-ignore
    const originalPost: any = await queryAsync(selectQuery, [postId]);

    if (originalPost.length === 0) {
      throw new Error('Post not found');
    }

    // Create the new comment post
    const commentPost = {
      content: commentText,
      title: 'Comment', // Adjust the title as needed
      author_id: userId,
      created_at: getDate(),
      parent_id: postId, // Set the parent_id to the original post's ID
      image: currentUserImg
    };

    // Insert the comment post into the database
    const insertQuery = 'INSERT INTO post SET ?';
    //@ts-ignore
    const insertResults: any = await queryAsync(insertQuery, commentPost);

    // Add the comment post's ID to the original post's children
    const commentPostId = insertResults.insertId;
    const updatedChildren = (originalPost[0].children || '') + commentPostId + ',';
   
    // Update the original post with the new children
    const updateQuery = 'UPDATE post SET children = ? WHERE idpost = ?';
    //@ts-ignore
    await queryAsync(updateQuery, [updatedChildren, postId]);

    // Close the database connection
    connection.end();
    revalidatePath(path);
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Unable to add comment');
  }
};

