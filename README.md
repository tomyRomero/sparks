# Sparks Portfolio Project

## 📋 Table of Contents

1. [Overview](#overview) 🌐
2. [Technologies Used](#technologies) ⚙️
3. [Features](#features) 🚀
4. [Live Site](#live) 📦
5. [Contact](#contact) 📫
6. [Database Schema](#database-schema) 📊
7. [Screenshots](#screenshots) 📸
8. [Sparks - AI Post Examples](#ai-post-examples) 🤖
9. [Acknowledgments](#acknowledgments) 🙌
10. [Setup](#setup) ⚙️

## <a name="overview">🌐 Overview </a>

Sparks is a full stack social media web app that is designed to help users discover as well as create new ideas for all things creative with the help of AI. 

## <a name="technologies">⚙️ Technologies Used </a>

- Frontend: [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Zod Forms](https://zod.dev/), [Shadcn](https://ui.shadcn.com/), [HeadlessUI](https://headlessui.com/)
  ![React](https://img.shields.io/badge/-React-61DAFB?style=flat&logo=react&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
  ![Zod Forms](https://img.shields.io/badge/-Zod%20Forms-FF3E00?style=flat)
  ![Shadcn](https://img.shields.io/badge/-Shadcn-2D3748?style=flat)
  ![HeadlessUI](https://img.shields.io/badge/-HeadlessUI-38B2AC?style=flat)

- Backend: [Node.js](https://nodejs.org/), [MySQL](https://www.mysql.com/), [Next.js](https://nextjs.org/)
  ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat&logo=node.js&logoColor=white)
  ![MySQL](https://img.shields.io/badge/-MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
  ![Next.js](https://img.shields.io/badge/-Next.js-000000?style=flat&logo=next.js&logoColor=white)

- Image Storage: [S3-AmazonWebServices](https://aws.amazon.com/s3/)
  ![Amazon S3](https://img.shields.io/badge/-AWS%20S3-232F3E?style=flat&logo=amazon-aws&logoColor=white)

- DataBase Management: [RDS-AmazonWebServices](https://aws.amazon.com/rds/), [MySQL Workbench](https://www.mysql.com/products/workbench/)
  ![Amazon RDS](https://img.shields.io/badge/-Amazon%20RDS-232F3E?style=flat)
  ![MySQL Workbench](https://img.shields.io/badge/-MySQL%20Workbench-4479A1?style=flat&logo=mysql&logoColor=white)

- Authentication: [Clerk](https://docs.clerk.dev/)
  ![Clerk](https://img.shields.io/badge/-Clerk-1B1F23?style=flat)

- AI Integration: [OpenAI](https://https://openai.com/), [Dall-E-3](https://openai.com/dall-e-3), [Gpt-3.5-turbo](https://openai.com/blog/gpt-3-5-turbo-fine-tuning-and-api-updates)
  ![OpenAI](https://img.shields.io/badge/-OpenAI-0082C6?style=flat)
  ![Dall-E-3](https://img.shields.io/badge/-Dall--E--3-593695?style=flat)
  ![Gpt-3.5-turbo](https://img.shields.io/badge/-Gpt--3.5--turbo-593695?style=flat)

- WebSockets: [Pusher](https://pusher.com/)
  ![Pusher](https://img.shields.io/badge/-Pusher-652B81?style=flat)


## <a name="features">🚀 Features</a>

- Fully CRUD , creates, reads, updates, deletes all types of posts such as regular ones, comments and even AI generated ones.
- AI-powered post generation with various categories and the ability to edit/delete if you are the author, AI image generation also included. 
  - Categories:
    - Movies and Novels (includes AI generated images if the User desires, optional)
    - Artworks, Fashion , Photography , (These are all AI generated images)
    - Haikus , Quote, Joke , Aphorism
  prompts used are saved and can be viewed when the sparks logo of the post is clicked!
- User-to-user Messaging system: powered by Pusher(Web Sockets) for realtime updates, ability to leave messages on read, ability to see when a user is online in chat. 
- Image Storage System: Cloud image storage powered by the cloud , allows all profile images, as well as profile posts and even AI generated images to be saved for future usage in a secure S3 bucket privately where only the developer can access them. Cache system included with local storage so images do not have to be fetched every single time.
- User profile management: Onboarding, Profile Edit 
- Activity feed - showing recent activity from other users to keep you engaged! Comes with pagination
- Infinite Scroll: incorporates an infinite scroll feature, providing users with a seamless browsing experience. With infinite scroll, users can effortlessly explore a continuous feed of content without the hassle of traditional pagination. 
- Home Page Feed Filtering - Allow users to filter out the type of posts they would like to see. 
- Like comment and share functionality: Allows the liking of posts, no user can like a post more than once, users can unlike posts as well, everything is reflected in database, posts can have children posts (comments, which can be liked as well, authors can delete their comments as well) and they are all recursively structured where every comment has a parent ID, therefore comments can have comments of their own, providing a twitter-like comment structure, all powered by a SQL dynamic structure, users can share posts directly to other users in their inboxes by clicking the share button which will send a message with the posts' link. When a parent post is deleted all children post is recursively deleted as well!
- Search functionality, search for user profiles as well as posts by keywords
- Notification System: updates when user recieves new message or activity
- Profile Page: Profile page for users with posts they have made, comments they have made and posts they have liked, as well as the ability to message users from there or even edit your bio, and image if it is your profile. 
- Database System: all changes are saved within the database so you can pick back up where you left off. 
- Fully Responsive for all screens, phones, tablets and desktops. 
- Global State System: using app context the app has a global state which helps with real-time functionalities for layout components. 
- Form Validation: Uses Zod Forms to put into place form validations where as users can only submit certain inputs depending on what is allowed.
- Liverages the latest of Next.js by using server actions and API routes, API routes include, openAIChat, openAIImage, and S3

## <a name="live"> 📦 Live Deployment </a>
The webapp is live and hosted by vercel https://sparkify.vercel.app

## <a name="contact" > 📫 Contact </a>
tomyfletcher99@hotmail.com
[![LinkedIn](https://img.shields.io/badge/-LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/tomy-romero-902476145/)

## <a name="database-schema"> 📊 Data Base Schema </a>
<img src="public/assets/DataBaseSchema.png" alt="Screenshot of SqlSchema" >

###  📊 Database Relationships
- User and Post Relationship:
One-to-Many relationship: A user can create multiple posts, but each post is associated with one user.

- Post and User (author) Relationship:
Many-to-One relationship: Many posts can be associated with one user (the author).

- Post and Post (parent-child) Relationship:
Recursive relationship: A post can have multiple child posts, creating a hierarchical structure.

- Chat and User (sender and receiver) Relationship:
Many-to-Many relationship: A user can be both the sender and receiver in multiple chats.

## <a name="screenshots"> 📸 Screenshots </a>

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
<img src="public/assets/sparks-prompt.png" alt="Screenshot of prompt in Phone">

### Create Studio
<img src="public/assets/sparks-studio.png" alt="Screenshot of create studio">

<img src="public/assets/editSpark.png" alt="Screenshot of edit spark">
<img src="public/assets/editPost.png" alt="Screenshot of edit post">
<img src="public/assets/editComment.png" alt="Screenshot of edit comment">

### Search
<img src="public/assets/sparks-search.png" alt="Screenshot of search users">
<img src="public/assets/sparks-search-post.png" alt="Screenshot of search post">

### Share
<img src="public/assets/sparks-share.png" alt="Screenshot of Share Post">

### Chats
<img src="public/assets/sparks-chats.png" alt="Screenshot of User Chats">
<img src="public/assets/sparks-message.png" alt="Screenshot of Messages">

### Activity
<img src="public/assets/sparks-noti.png" alt="Screenshot of User Activity">

### Profile
<img src="public/assets/sparks-profile.png" alt="Screenshot of User Profile">


# <a name="ai-post-examples">🤖 Sparks Examples [AI Posts] </a>
Below are some examples of generated Sparks

<img src="public/assets/examplespark.png" alt="Screenshot of AI Spark">

<img src="public/assets/example2spark.png" alt="Screenshot of AI Spark">

<img src="public/assets/movieSpark.png" alt="Screenshot of AI Spark">


<img src="public/assets/novelSpark.png" alt="Screenshot of AI Spark">


<img src="public/assets/artworkSpark.png" alt="Screenshot of AI Spark">


<img src="public/assets/fashionSpark.png" alt="Screenshot of AI Spark">


<img src="public/assets/photoSpark.png" alt="Screenshot of AI Spark">

<img src="public/assets/quoteSpark.png" alt="Screenshot of AI Spark">



## 🚀 Future Improvements
### Performance Optimization

- Optimizing performance is my top priority. I aim to minimize unnecessary re-renders on the client and reduce function executions, both on the server and client sides. Contributions in this area will greatly enhance the overall user experience.

- Currently, large API requests to OpenAI, such as those for movies and novels, may lead to server function timeouts. This limitation is due to Vercel's free-tier hosting plan, which imposes a 10-second limit on server functions. Collaborative efforts to address this issue are essential for ensuring smooth interactions with external APIs.

## Project Status

All features should be fully funtional, please if you have any concerns or encounter any bugs, feel free to raise an issue or contact me.

### Future Feature Idea for Contributions

This project is open source and contributors are welcomed
Future updates may be focused on these new features that I have in mind:

### 1. Followers List and Feed

Introduce a followers list and feed, providing users with a personalized stream of content from accounts they follow.

### 2. Group Chats

Explore the implementation of group chats, fostering community interactions and group discussions.

### 3. Switch from Clerk to Next auth

Switch to a more independent form of auth, build from the ground up and allow vistors to browse posts even when not logged in

## <a name="acknowledgments">  🙌 Acknowledgments</a>
Shout out to https://loading.io/ for all the icons provided
Shout out to https://unsplash.com/ for all the pictures that were not AI generated or user submitted
Shout out to adrianhajdin on Github for tutorials on Next.js

## Setup
### .env.example is provided to follow on what keys the project needs

```bash
# Clone the repository
git clone https://github.com/tomyRomero/sparks

# Navigate to the project directory
cd sparks

# Install dependencies
npm install

# Start the development server
npm run dev




