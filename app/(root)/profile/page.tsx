"use client"

import React, { useEffect, useState } from 'react';
import { currentUser } from '@clerk/nextjs';
import { fetchUser } from '@/lib/actions/user.actions';
import { connectDb } from '@/lib/sql';


const ProfilePage = () => {
  const [userData, setUserData] = useState(false);

  const load = async () => {

  };

  useEffect(() => {
    load();
  }, []); // Empty dependency array ensures the effect runs once on mount

  return (
    <div>
      <h1>Profile!!</h1>
      {userData ? <h2>Connected to DB</h2> : <p>Loading...</p>}
    </div>
  );
};

export default ProfilePage;
