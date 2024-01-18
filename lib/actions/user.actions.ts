"use server"

import {connectDb} from '@/lib/sql'
import { revalidatePath } from 'next/cache';
import { currentUser } from '@clerk/nextjs';

import util from 'util';

export const getClerkUser = async ()=> {
  const data = await currentUser()

  return data?.id
}

export const getUsers = async () => {
  return new Promise(async (resolve, reject) => {
    try {

      // Connect to the database (parameter is name of the schema/database to connect)
      const connection = connectDb("spark", "getUser");

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
    const connection = connectDb('spark', "fetchUser"); // returns a Connection
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
   const connection = connectDb('spark', "updateOrcreateUser");
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
     const connection = connectDb('spark', "updateOrcreateUser");
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
    const connection = connectDb('spark', "updateOrcreateUser");
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

//Function to fetch the posts that belong to the user that have been liked
export const fetchLikedPosts = async (userId: string, limit: number) => {
  try {
    const connection = connectDb('spark', "fetchLikedPosts");
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

//fetches comments on Posts created by the User
export const fetchCommentsOnPostsByUser = async (userId: string, limit: number) => {
  try {
    const connection = connectDb('spark' , "fetchCommentsOnPostsByUser");
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

//Fetches both of the functions above in a sorted array
export const fetchLikesAndCommentsByUser = async (userId: string, limit: number, pageNumber: number, pageSize: number) => {
  try {
    
    const [likedPosts, commentsOnPosts] = await Promise.all([
      // Fetch liked posts
      fetchLikedPosts(userId, limit),
      // Fetch comments on posts
      fetchCommentsOnPostsByUser(userId, limit)
    ]);


    if(likedPosts && commentsOnPosts)
    {
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

    // Calculate start and end indices for pagination
    const startIndex = (pageNumber - 1) * pageSize
    const endIndex = startIndex + pageSize;
    // Extract the current page of results
    const currentPageResults = combinedResults.slice(startIndex, endIndex);
    console.log("Activity Ran")
    return { activity: currentPageResults, isNext: combinedResults.length > endIndex };
    }
    else{
      return { activity: [], isNext: false }
    }
  } catch (error) {
    console.error('Error fetching likes and comments:', error);
    throw new Error('Failed to fetch likes and comments');
  }
};



//fetches users based on a search query using a searchbar, if search query is empty all users are returned
export const fetchUsers = async ({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: "asc" | "desc";
}) => {
  try {
    const connection = connectDb("spark", "fetchUsersHome");
    const queryAsync = util.promisify(connection.query).bind(connection);

    // Calculate the number of users to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Define the SQL query to fetch users with related data, ordered by createdAt in descending order
    const selectQuery = `
      SELECT
        U.*,
        (
          SELECT COUNT(*)
          FROM user AS U2
          WHERE U2.id != ? AND (? = '' OR (U2.username LIKE ? OR U2.name LIKE ?))
        ) AS total_count
      FROM
        user AS U
      WHERE
        U.id != ?
        AND (? = '' OR (U.username LIKE ? OR U.name LIKE ?))
      ORDER BY
        U.id ${sortBy === "desc" ? "DESC" : "ASC"}
      LIMIT
        ?, ?;
    `;

    // Define query parameters
    const selectValues = [
      userId,
      searchString,
      `%${regex.source}%`,
      `%${regex.source}%`,
      userId,
      searchString,
      `%${regex.source}%`,
      `%${regex.source}%`,
      skipAmount,
      pageSize,
    ];

    // Execute the SQL query to fetch users

    //@ts-ignore
    const results: any = await queryAsync(selectQuery, selectValues);

    // Close the database connection
    connection.end();

    // Count the total number of users
    const totalUsersCount =
      results.length > 0 ? results[0].total_count : results.length;
    const isNext = totalUsersCount > skipAmount + results.length;

    return { users: results, isNext };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Function to fetch user-specific posts
export const fetchUserPosts = async (accountId: string) => {
  try {
    const connection = connectDb('spark', "fetchUserPosts");
    const queryAsync = util.promisify(connection.query).bind(connection);

    // Define the SQL query to fetch user-specific posts
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
        AND P.author_id = ?  -- Filter posts by author ID
      ORDER BY
        P.idpost DESC;
    `;

    // Define query parameters
    const selectValues = [accountId];

    // Execute the SQL query to fetch user-specific top-level posts
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

    // Return the results
    return results;
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Failed to fetch user-specific posts');
  }
};






// Function to fetch user-specific comments and their children
export const fetchUserComments = async (accountId: string) => {
  try {
    const connection = connectDb('spark', "fetchUserComments");
    const queryAsync = util.promisify(connection.query).bind(connection);

    // Define the SQL query to fetch user-specific comments and their children
    const selectQuery = `
      SELECT
        C.*,
        U.username AS author_username,
        U.image AS author_image,
        (
          SELECT COUNT(*)
          FROM post AS CC
          WHERE CC.parent_id = C.idpost
        ) AS children_count,
        C.likes
      FROM
        post AS C
      LEFT JOIN
        user AS U ON C.author_id = U.id
      WHERE
        C.parent_id IS NOT NULL
        AND C.author_id = ?  -- Filter comments by author ID
      ORDER BY
        C.idpost DESC;
    `;

    // Define query parameters
    const selectValues = [accountId];

    // Execute the SQL query to fetch user-specific comments
    //@ts-ignore
    const results: any = await queryAsync(selectQuery, selectValues);

    // Format children for each comment
    for (const comment of results) {
      // Fetch and format comment's children
      if (comment.children_count > 0) {
        const childrenIds = comment.children.split(',').filter(Boolean); // Split the comma-separated string
        const childrenQuery = 'SELECT * FROM post WHERE idpost IN (?)';
        //@ts-ignore
        const childrenComments: any = await queryAsync(childrenQuery, [childrenIds]);

        if (childrenComments.length > 0) {
          comment.children = childrenComments;
        } else {
          comment.children = [];
        }
      } else {
        comment.children = [];
      }
    }

    // Close the database connection
    connection.end();

    // Return the results
    return results;
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Failed to fetch user-specific comments');
  }
};

// Function to fetch posts liked by a specific user
export const fetchLikedPostsByUser = async (userId: string) => {
  try {
    const connection = connectDb('spark', "fetchLikedPostsByUser");
    const queryAsync = util.promisify(connection.query).bind(connection);

    // Define the SQL query to fetch posts liked by the user
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
        AND FIND_IN_SET(?, P.likes) > 0  -- Check if the user ID is in the likes column
      ORDER BY
        P.idpost DESC;
    `;

    // Define query parameters
    const selectValues = [userId];

    // Execute the SQL query to fetch liked posts
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

    // Return the results
    console.log("Posts Liked by User: ", results)
    return results;
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Failed to fetch liked posts');
  }
};

export const doesPostBelongToUser = async (postId: string, userId: string) => {
  try {
    const connection = connectDb('spark', "deoesPostBelongToUser");
    const queryAsync = util.promisify(connection.query).bind(connection);

    // Fetch the post by its ID
    const selectQuery = 'SELECT author_id FROM post WHERE idpost = ?';
    //@ts-ignore
    const posts: any = await queryAsync(selectQuery, [postId]);


    console.log("DOES POST BELONG: ", posts)

    if (posts.length === 0) {
      // Post not found
      connection.end();
      return false;
    }

    const postAuthorId = posts[0].author_id;

    // Check if the post belongs to the specified user

    const belongsToUser = postAuthorId === userId;

    // Close the database connection
    connection.end();

    return belongsToUser;
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Unable to check post ownership');
  }
};





