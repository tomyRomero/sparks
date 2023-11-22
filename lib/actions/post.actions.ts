"use server"
import {connectDb} from '@/lib/sql'
import { revalidatePath } from 'next/cache';

import util from 'util';

function getDateTime() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, '0');
  let hours = currentDate.getHours();
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'pm' : 'am';

  // Convert hours to 12-hour format
  hours = hours % 12 || 12;

  // Combine the date and time components into a string with the desired format (e.g., "MM-DD-YYYY h:mm am/pm")
  return `${month}-${day}-${year} ${hours}:${minutes} ${period}`;
}

export const createPost = async ({text,author,path, image, title} : {text: string, author: string, path: string, image:string , title: string}) => {
    try{
    
        const connection = connectDb('spark');
        // Promisify connection.query
        const queryAsync = util.promisify(connection.query).bind(connection);
        const insertQuery = 'INSERT INTO post (content, image, title, author_id, created_at) VALUES (?,?, ?, ?, ?)';
        const insertValues = [text,image, title, author, getDateTime()]
        //@ts-ignore
        const insertResults: any[] = await queryAsync(insertQuery, insertValues);
        console.log("Successfully Created Post: " , insertResults)
        revalidatePath(path);
        return true;
    }catch(error)
    {
        console.log("Error: " , error)
        throw new Error(`Error Occured: ${error}`)
    }
}

export const fetchPosts = async (pageNumber = 1, pageSize = 20) => {
  try {
    const connection = connectDb('spark'); // Replace 'spark' with your database name
    const queryAsync = util.promisify(connection.query).bind(connection);

    // Calculate the number of posts to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Define the SQL query to fetch top-level posts with related data, ordered by idpost in descending order
    const selectQuery = `
      SELECT
        P.*,
        U.username AS author_username,
        U.image AS author_image,
        (
          SELECT COUNT(*)
          FROM post AS C
          WHERE C.parent_id = P.idpost
        ) AS children_count,
        P.likes
      FROM
        post AS P
      LEFT JOIN
        user AS U ON P.author_id = U.id
      WHERE
        P.parent_id IS NULL
      ORDER BY
        P.idpost DESC
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
    //console.log("ALL POSTS: ", results)
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
     // Fetch post's children with author username
      const childrenQuery = `
      SELECT P.*, U.username AS author_username, U.image AS author_image
      FROM post AS P
      LEFT JOIN user AS U ON P.author_id = U.id
      WHERE P.idpost IN (?);
      `;
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

export const addCommentToPost = async (postId: string, commentText: string, userId: string, path: any, currentUserImg: string) => {

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
      created_at: getDateTime(),
      parent_id: postId, // Set the parent_id to the original post's ID
      image: currentUserImg,
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
    revalidatePath(path);
    // Close the database connection
    connection.end();
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Unable to add comment');
  }
};

export const addLikeToPost = async (postId: string, userId: string) => {
  try {
    const connection = connectDb('spark'); 
    const queryAsync = util.promisify(connection.query).bind(connection);

    // Fetch existing likes for the post
    const selectQuery = 'SELECT likes FROM post WHERE idpost = ?';

    //@ts-ignore
    const existingLikesResult: any = await queryAsync(selectQuery, [postId]);

    if (existingLikesResult.length === 0) {
      // Post not found
      connection.end();
      throw new Error('Post not found');
    }

    const existingLikes = existingLikesResult[0].likes || '';
    const existingRecentLike = existingLikesResult[0].recent_like || '';

    // Split the existing likes string into an array and filter out duplicates
    const existingLikesArray = existingLikes.split(',').filter((id: string) => id !== userId);

    // Add the new userId to the array
    existingLikesArray.push(userId);

    // Join the array back into a string
    const newLikes = existingLikesArray.join(',');

    // Update the post with the new likes and recent_like timestamp
    const updateQuery = 'UPDATE post SET likes = ?, recent_like = ? WHERE idpost = ?';

    const updateValues = [newLikes, getDateTime(), postId];

    //@ts-ignore
    const results = await queryAsync(updateQuery, updateValues);

    // Close the database connection
    connection.end();
    console.log("Like Resuls:", results)
    return { success: true, message: 'Like added successfully' };
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Unable to add like to post');
  }
};

export const removeLikeFromPost = async (postId: string, userId: string) => {
  try {
    const connection = connectDb('spark');
    const queryAsync = util.promisify(connection.query).bind(connection);

    // Fetch existing likes for the post
    const selectQuery = 'SELECT likes FROM post WHERE idpost = ?';

    //@ts-ignore
    const existingLikesResult: any = await queryAsync(selectQuery, [postId]);

    if (existingLikesResult.length === 0) {
      // Post not found
      connection.end();
      throw new Error('Post not found');
    }

    const existingLikes = existingLikesResult[0].likes || '';

    // Split the existing likes string into an array
    const existingLikesArray = existingLikes.split(',');

    // Check if the userId is in the existingLikesArray
    const userIndex = existingLikesArray.indexOf(userId);

    if (userIndex !== -1) {
      // Remove the userId from the array
      existingLikesArray.splice(userIndex, 1);

      // Join the array back into a string
      const newLikes = existingLikesArray.join(',');

      // Update the post with the new likes
      const updateQuery = 'UPDATE post SET likes = ? WHERE idpost = ?';

      //@ts-ignore
      await queryAsync(updateQuery, [newLikes, postId]);

      // Close the database connection
      connection.end();

      console.log("Like removed successfully");
      return { success: true, message: 'Like removed successfully' };
    } else {
      // If userId is not in existingLikes, it means the user has not liked the post
      connection.end();
      return { success: false, message: 'User has not liked the post' };
    }
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Unable to remove like from post');
  }
};

export const deletePost = async (postId: string, path: string, parent_id: string|null, isComment: boolean|undefined) => {
  try {
    const connection = connectDb('spark');
    // Promisify connection.query
    const queryAsync = util.promisify(connection.query).bind(connection);

    if (isComment) {
      // If it's a comment, delete the comment and its children first
      const fetchChildrenQuery = 'SELECT idpost FROM post WHERE parent_id = ?';
      const fetchChildrenValues = [postId];
      //@ts-ignore
      const commentChildrenResults: any[] = await queryAsync(fetchChildrenQuery, fetchChildrenValues);

      for (const child of commentChildrenResults) {
        await deletePost(child.idpost, path, postId, true);
      }

      // Now, delete the comment post
      const deleteQuery = 'DELETE FROM post WHERE idpost = ?';
      const deleteValues = [postId];
      //@ts-ignore
      await queryAsync(deleteQuery, deleteValues);

      // Remove the comment post from the parent's children column
      if (parent_id) {
        const fetchParentQuery = 'SELECT children FROM post WHERE idpost = ?';
        const fetchParentValues = [parent_id];
        //@ts-ignore
        const parent: any = await queryAsync(fetchParentQuery, fetchParentValues);

        if (parent && parent.length > 0) {
          const childrenString = parent[0].children;
          const updatedChildrenString = childrenString.replace(`${postId},`, '');

          const updateParentQuery = 'UPDATE post SET children = ? WHERE idpost = ?';
          const updateParentValues = [updatedChildrenString, parent_id];

          //@ts-ignore
          await queryAsync(updateParentQuery, updateParentValues);
        }
      }

    } else {
      // If it's not a comment, delete the post and its children
      const fetchChildrenQuery = 'SELECT idpost FROM post WHERE parent_id = ?';
      const fetchChildrenValues = [postId];
      //@ts-ignore
      const childrenResults: any[] = await queryAsync(fetchChildrenQuery, fetchChildrenValues);

      for (const child of childrenResults) {
        await deletePost(child.idpost, path, postId, false);
      }

      // Now, delete the post
      const deleteQuery = 'DELETE FROM post WHERE idpost = ?';
      const deleteValues = [postId];
      //@ts-ignore
      await queryAsync(deleteQuery, deleteValues);

      // Update the parent post's children column to null
      if (parent_id) {
        const updateParentQuery = 'UPDATE post SET children = null WHERE idpost = ?';
        const updateParentValues = [parent_id];

        //@ts-ignore
        await queryAsync(updateParentQuery, updateParentValues);
      }
    }

    // Reload the Page
    revalidatePath(path);
  } catch (error) {
    console.log("Error: ", error);
    throw new Error("Error Deleting Content")
  }
};

export const fetchLikedPosts = async (userId: string, limit: number) => {
  try {
    const connection = connectDb('spark');
    const queryAsync = util.promisify(connection.query).bind(connection);

    const selectQuery = `
      SELECT
        P.*,
        U.username AS author_username,
        U.image AS author_image
      FROM
        post AS P
      INNER JOIN
        user AS U ON P.author_id = U.id
      WHERE
        P.likes IS NOT NULL AND P.likes != '' AND P.author_id = ?
      ORDER BY
        P.recent_like DESC
      LIMIT ?;
    `;

    const selectValues = [userId, limit];

    //@ts-ignore
    const results = await queryAsync(selectQuery, selectValues);

    connection.end();
    return results;
  } catch (error) {
    console.error('Error fetching recent liked posts:', error);
    throw new Error('Failed to fetch recent liked posts');
  }
};

export const fetchCommentsOnPostsByUser = async (userId: string, limit: number) => {
  try {
    const connection = connectDb('spark');
    const queryAsync = util.promisify(connection.query).bind(connection);

    const selectQuery = `
      SELECT
        C.*,
        P.title AS post_title,
        U.username AS author_username,
        U.image AS author_image
      FROM
        post AS C
      INNER JOIN
        post AS P ON C.parent_id = P.idpost
      INNER JOIN
        user AS U ON C.author_id = U.id
      WHERE
        P.author_id = ?
      ORDER BY
        C.created_at DESC
      LIMIT ?;
    `;

    const selectValues = [userId, limit];

    //@ts-ignore
    const results = await queryAsync(selectQuery, selectValues);

    connection.end();
    return results;
  } catch (error) {
    console.error('Error fetching comments on posts by user:', error);
    throw new Error('Failed to fetch comments on posts by user');
  }
};


export const fetchLikesAndCommentsByUser = async (userId: string, limit: number) => {
  try {
    // Fetch liked posts
    const likedPosts = await fetchLikedPosts(userId, limit);

    // Fetch comments on posts
    const commentsOnPosts = await fetchCommentsOnPostsByUser(userId, limit);

    // Combine and add type property to each item
    const combinedResults = [
      //@ts-ignore
      ...likedPosts.map(post => ({ ...post, type: 'like' })),
      //@ts-ignore
      ...commentsOnPosts.map(comment => ({ ...comment, type: 'comment' })),
    ];

    // Sort the combined array by the recent property (recent_like or created_at)
    combinedResults.sort((a, b) => {
      const recentA = a.recent_like || a.created_at;
      const recentB = b.recent_like || b.created_at;
      return new Date(recentB).getTime() - new Date(recentA).getTime();
    });

    return combinedResults;
  } catch (error) {
    console.error('Error fetching likes and comments:', error);
    throw new Error('Failed to fetch likes and comments');
  }
};

















