"use client"

import React, { useEffect, useState } from 'react';
import { currentUser } from '@clerk/nextjs';
import { fetchUser } from '@/lib/actions/user.actions';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);

  const load = async () => {
    try {
      const userId = 'user_2XSaXcIXd9dXAjxVuNhq0L7RXkk';
      const userInfo = await fetchUser(userId);
      setUserData(userInfo);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    load();
  }, []); // Empty dependency array ensures the effect runs once on mount

  return (
    <div>
      <h1>Profile!!</h1>
      {userData ? <h2>{
        //@ts-ignore
      userData.username
      }</h2> : <p>Loading...</p>}
    </div>
  );
};

export default ProfilePage;
