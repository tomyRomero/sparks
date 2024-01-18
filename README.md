# Sparks Portfolio Project

## Overview

Sparks is a full stack social media web app that is designed to help users discover as well as create new ideas for all things creative with the help of AI. 

## Technologies Used

- Frontend: [React](https://reactjs.org/),[tailwind](https://tailwindcss.com/), [zodforms](https://zod.dev/), [shadcn](https://ui.shadcn.com/), [HeadlessUI] (https://headlessui.com/)
- Backend: [Node.js](https://nodejs.org/),[MySQL](https://www.mysql.com/),[Next.js](https://nextjs.org/) 
- Image Storage: [S3-AmazonWebServices](https://aws.amazon.com/s3/)
- DataBase Mangement: [RDS-AmazonWebServices](https://aws.amazon.com/rds/) , [MySQL-WorkBench] (https://www.mysql.com/products/workbench/)
- Authentication: [Clerk](https://docs.clerk.dev/)
- AI Integration: [OpenAI](https://https://openai.com/) , [Dall-E-3] (https://openai.com/dall-e-3) , [Gpt-3.5-turbo] (https://openai.com/blog/gpt-3-5-turbo-fine-tuning-and-api-updates)
- WebSockets: [Pusher](https://pusher.com/)
- ID Managment: [uuid] (https://www.npmjs.com/package/uuid)

## Features

- List the main features of your application.
- AI-powered post generation with various categories and the ability to delete ones you do not like if you are the author, AI image generation also included. 
  - Categories:
    - Movies and Novels (includes AI generated images if the User desires, optional)
    - Artworks, Fashion , Photography , (These are all AI generated images)
    - Haikus , Quote, Joke , Aphorism
- Image Storage System: Cloud image storage powered by the cloud , allows all profile images, as well as profile posts and even AI generated images to be saved for future usage in a secure S3 bucket privately where only the developer can access them. Cache system included with local storage so images do not have to be fetched every single time.
- User profile management: Onboarding, Profile Edit 
- User-to-user Messaging system: powered by Pusher(Web Sockets) for realtime updates, ability to leave messages on read, ability to see when a user is online in chat. 
- Activity feed - and pagination for performance
- Home Page Feed Filtering - Allow users to filter out the type of posts they would like to see. 
- Like comment and share functionality: Allows the liking of posts, no user can like a post more than once, users can unlike posts as well, everything is reflected in database, posts can have children posts (comments, which can be liked as well, authors can delete their comments as well) and they are all recursively structured where every comment has a parent ID, therefore comments can have comments of their own, providing a twitter-like comment structure, all powered by a SQL dynamic structure, users can share posts directly to other users in their inboxes by clicking the share button which will send a message with the posts' link. 
- Search functionality, search for user profiles. 
- Notification System: updates when user recieves new message or activity
- Profile Page: Profile page for users with posts they have made, comments they have made and posts they have liked, as well as the ability to message users from there or even edit your bio, and image if it is your profile. 
- Database System: all changes are saved within the database so you can pick back up where you left off. 
- Fully Responsive for all screens, phones, tablets and desktops. 
- Global State System: using app context the app has a global state which helps with real-time functionalities for layout components. 
- Form Validation: Uses Zod Forms to put into place form validations where as users can only submit certain inputs depending on what is allowed.
- Liverages the latest of Next.js by using server actions and API routes, API routes include, openAIChat, openAIImage, and S3

## Deployment
The webapp is live and hosted by vercel https://sparkify.vercel.app

## Contact
tomyfletcher99@hotmail.com

## Data Base Schema 
<img src="public/assets/DataBaseSchema.png" alt="Screenshot of SqlSchema" >

### Database Relationships
- User and Post Relationship:
One-to-Many relationship: A user can create multiple posts, but each post is associated with one user.

- Post and User (author) Relationship:
Many-to-One relationship: Many posts can be associated with one user (the author).

- Post and Post (parent-child) Relationship:
Recursive relationship: A post can have multiple child posts, creating a hierarchical structure.

- Chat and User (sender and receiver) Relationship:
Many-to-Many relationship: A user can be both the sender and receiver in multiple chats.

## Screenshots

User interface and different functionalities of Sparks.

### Login
<img src="public/assets/sparks-login.png" alt="Screenshot of login">

### Profile Set Up
<img src="public/assets/sparks-onboard.png" alt="Screenshot of Home" >

### Home
<img src="public/assets/sparks-home.png" alt="Screenshot of Home" >

### Responsive
<img src="public/assets/sparks-moblie.png" alt="Screenshot of Home in Mobile">
<img src="public/assets/sparks-tablet.png" alt="Screenshot of Home in Tablet">

### Create Studio
<img src="public/assets/sparks-studio.png" alt="Screenshot of User Profile">

### Sparks Post
<img src="public/assets/sparks-post.png" alt="Screenshot of Post">

### Share
<img src="public/assets/sparks-share.png" alt="Screenshot of Share Post">

### Chats
<img src="public/assets/sparks-chats.png" alt="Screenshot of User Chats">
<img src="public/assets/sparks-message.png" alt="Screenshot of Messages">

### Activity
<img src="public/assets/sparks-noti.png" alt="Screenshot of User Activity">

### Profile
<img src="public/assets/sparks-profile.png" alt="Screenshot of User Profile">

# AI Post Examples
Below I tested all AI Post Categories with the same prompt , "apples in a warm summer's glow". These are the results. 

### Movie Spark
<img src="public/assets/movieSpark.png" alt="Screenshot of AI Spark">

### Novel Spark
<img src="public/assets/novelSpark.png" alt="Screenshot of AI Spark">

### Artwork Spark
<img src="public/assets/artworkSpark.png" alt="Screenshot of AI Spark">

### Fashion Spark
<img src="public/assets/fashionSpark.png" alt="Screenshot of AI Spark">

### Photography Spark
<img src="public/assets/photoSpark.png" alt="Screenshot of AI Spark">

### Haikus Spark
<img src="public/assets/haikusSpark.png" alt="Screenshot of AI Spark">

### Quote Spark
<img src="public/assets/quoteSpark.png" alt="Screenshot of AI Spark">

### Joke Spark
<img src="public/assets/jokeSpark.png" alt="Screenshot of AI Spark">

### Aphorism Spark
<img src="public/assets/aphorismSpark.png" alt="Screenshot of AI Spark">

## Contributions
This project is open source and contributors are welcomed

## Future Improvements
### Performance Optimization

- Optimizing performance is my top priority. I aim to minimize unnecessary re-renders on the client and reduce function executions, both on the server and client sides. Contributions in this area will greatly enhance the overall user experience.

- Currently, large API requests to OpenAI, such as those for movies and novels, may lead to server function timeouts. This limitation is due to Vercel's free-tier hosting plan, which imposes a 10-second limit on server functions. Collaborative efforts to address this issue are essential for ensuring smooth interactions with external APIs.

## Project Status

- **Literature Studio**: Works on the deployed version.
- **Story and Gallery Studio**: Currently functional on localhost.

## New Features and Contributions

Future updates may be focused on these new features that I have in mind:

### 1. Post Search

Enhance user experience by implementing a post search functionality, allowing users to discover content more efficiently.

### 2. Followers List and Feed

Introduce a followers list and feed, providing users with a personalized stream of content from accounts they follow.

### 3. Group Chats

Explore the implementation of group chats, fostering community interactions and group discussions.

## Acknowledgments
Shout out to https://loading.io/ for all the icons provided
Shout out to https://unsplash.com/ for all the pictures that were not AI generated or user submitted
Shout out to adrianhajdin on Github for Inspiration and tutorials on Next.js

## Setup

```bash
# Clone the repository
git clone https://github.com/tomyRomero/sparks

# Navigate to the project directory
cd sparks

# Install dependencies
npm install

# Start the development server
npm run dev




