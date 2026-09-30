"use server"
import {connectDb} from '@/lib/sql'
import { revalidatePath } from 'next/cache';
import { getDateTime } from '../utils';
import util from 'util';
import { getPusher } from './chat.actions';


export const createPost = async ({ text, author, path, image, title, prompt }: { text: string, author: string, path: string, image: string, title: string, prompt: string }): Promise<number | null> => {
  try {
      const connection = connectDb('spark', "createPost");
      // Promisify connection.query
      const queryAsync = util.promisify(connection.query).bind(connection);
      const insertQuery = 'INSERT INTO post (content, image, title, author_id, created_at, prompt) VALUES (?, ?, ?, ?, ?, ?)';
      const insertValues = [text, image, title, author, getDateTime(), prompt];
      //@ts-ignore
      const insertResults: any = await queryAsync(insertQuery, insertValues);
      console.log("Successfully Created Post: ", insertResults);
      revalidatePath(path);
      return insertResults.insertId || null; // Assuming insertId is the ID of the newly inserted post
  } catch (error) {
      console.log("Error: ", error);
      throw new Error(`Error Occurred: ${error}`);
  }
};


export const updatePost = async ({
  postId,
  text,
  image,
  path
}: {
  postId: string;
  text: string;
  image: string;
  path: string
}) => {
  try {
    const connection = connectDb('spark', 'updatePost');
    // Promisify connection.query
    const queryAsync = util.promisify(connection.query).bind(connection);
    const updateQuery =
      'UPDATE post SET content = ?, image = ? WHERE idpost = ?';
    const updateValues = [text, image, postId];
    //@ts-ignore
    const updateResults: any[] = await queryAsync(updateQuery, updateValues);
    console.log('Successfully Updated Post: ', updateResults);
    revalidatePath(path);
    return true;
  } catch (error) {
    console.log('Error: ', error);
    throw new Error(`Error Occurred: ${error}`);
  }
};

export const searchPosts = async ({
  pageNumber = 1,
  pageSize = 20,
  searchQuery = '',
}: {
  pageNumber?: number;
  pageSize?: number;
  searchQuery?: string;
}) => {
  try {
    const connection = connectDb('spark', 'fetchPosts');
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
        AND (
          P.title LIKE ? OR
          P.content LIKE ? OR
          U.username LIKE ?
        )
      ORDER BY
        P.idpost DESC
      LIMIT
        ?, ?;
    `;

    // Define query parameters
    const searchParam = `%${searchQuery}%`;
    const selectValues = [searchParam, searchParam, searchParam, skipAmount, pageSize];

    // Execute the SQL query to fetch top-level posts

    //@ts-ignore
    const results: any = await queryAsync(selectQuery, selectValues);

    // Format children for each post
    for (const post of results) {
      // Fetch and format post's children
      if (post.children_count > 0) {
        const childrenIds = post.children.split(',').filter(Boolean);
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

    // Count the total number of top-level posts
    const totalPostsCountQuery =
      'SELECT COUNT(*) AS total_count FROM post WHERE parent_id IS NULL AND (title LIKE ? OR content LIKE ? OR author_id IN (SELECT id FROM user WHERE username LIKE ?))';
    
      //@ts-ignore
    const totalPostsCountResults: any = await queryAsync(totalPostsCountQuery, [searchParam, searchParam, searchParam]);
    const totalPostsCount = totalPostsCountResults[0].total_count;
    const isNext = totalPostsCount > skipAmount + results.length;

    // Close the database connection
    connection.end();

    return { results, isNext };
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Failed to fetch top-level posts');
  }
};



export const fetchPosts = async (pageNumber = 1, pageSize = 20, titleFilter = '') => {
  try {
    const connection = connectDb('spark', "fetchPosts"); // Replace 'spark' with your database name
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
        AND (? = '' OR P.title = ?)  -- Check for title filter
      ORDER BY
        P.idpost DESC
      LIMIT
        ?, ?;
    `;

    // Define query parameters
    const selectValues = [titleFilter, titleFilter, skipAmount, pageSize];

    // Execute the SQL query to fetch top-level posts
    //@ts-ignore
    const results: any = await queryAsync(selectQuery, selectValues);

    // Format children for each post
    for (const post of results) {
      // Fetch and format post's children
      if (post.children_count > 0) {
        const childrenIds = post.children.split(',').filter(Boolean);
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

    // Count the total number of top-level posts
    const totalPostsCountQuery = "SELECT COUNT(*) AS total_count FROM post WHERE parent_id IS NULL AND (? = '' OR title = ?)";
    //@ts-ignore
    const totalPostsCountResults: any = await queryAsync(totalPostsCountQuery, [titleFilter, titleFilter]);
    const totalPostsCount = totalPostsCountResults[0].total_count;
    const isNext = totalPostsCount > skipAmount + results.length;

    // Close the database connection
    connection.end();

    return { results, isNext };
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Failed to fetch top-level posts');
  }
};


export const fetchPostById = async (postId :string) => {
  try {
    const connection = connectDb('spark', "fetchPostById"); // Replace 'spark' with your database name
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
    const connection = connectDb('spark', "addCommentToPost"); // Replace 'spark' with your database name
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
      //Used later on for Activity
      read_status: true
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
    const updateResults = await queryAsync(updateQuery, [updatedChildren, postId]);

     //If comment was successful use Pusher for Real Time Events
     if(updateResults && insertResults)
     {
      const pusher = await getPusher();
      pusher.trigger("sparks", "comment", {postId, userId});
     }

    revalidatePath(path);
    // Close the database connection
    connection.end();
    return true
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Unable to add comment');
    return false
  }
};

export const addLikeToPost = async (postId: string, userId: string) => {
  try {
    const connection = connectDb('spark', "addLikeToPost"); 
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
    const updateQuery = 'UPDATE post SET likes = ? , read_status = ? , recent_like = ? WHERE idpost = ?';

    const updateValues = [newLikes, 1 , getDateTime(), postId];

    //@ts-ignore
    const results = await queryAsync(updateQuery, updateValues);

    if(results)
    {
      const pusher = await getPusher();
      pusher.trigger("sparks", "like", {postId, userId});
    }

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
    const connection = connectDb('spark', "removeLikeFromPost");
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
      const updateQuery = 'UPDATE post SET likes = ?, read_status = ? WHERE idpost = ?';

      //@ts-ignore
      await queryAsync(updateQuery, [newLikes, 0, postId]);

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
    const connection = connectDb('spark', "deletePost");
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

export const updatePostReadStatus = async (postId: string): Promise<boolean> => {
  try {
    const connection = connectDb('spark', "updatePostReadStatus"); // Replace 'spark' with your database name
    const queryAsync = util.promisify(connection.query).bind(connection);

    // Update post's read_status to 1
    const updateQuery = 'UPDATE post SET read_status = null WHERE idpost = ?';

    //@ts-ignore
    const updateResult: any[] = await queryAsync(updateQuery, [postId]);

    console.log("Read_status Update: ", updateResult)

    // Close the database connection
    connection.end();

    return true
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Unable to update post read status');
  }
};





















