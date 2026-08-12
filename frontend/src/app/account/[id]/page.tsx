"use client";
import React, { useEffect, useState } from 'react'
import { User } from '@/type';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { user_service } from '@/context/AppContext';
import Cookies from 'js-cookie';
import Loading from '@/components/loading';
import Info from '../components/info';
import Skills from '../components/skills';

const UserAccount = () => {

    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const {id} = useParams();

    

    async function fetchUser() {
      const token = Cookies.get("token");
      try {
        const {data} = await axios.get(`${user_service}/api/user/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        setUser(data)
        console.log(data);
      } catch (error) {
        console.log(error);
      }finally{
        setLoading(false);
      }
    }

     useEffect(() => {
    fetchUser();
  }, [id]);

    if(loading) return <Loading/>

  return (
        <>{ user && <div className='mx-auto w-full max-w-5xl px-3 py-4 sm:px-6'>
            <Info user={user} isYourAccount={false}/>
             {
          user.role === "jobseeker" && <Skills user={user} isYourAccount={false}/>
         }
          </div>}</>
  )
}

export default UserAccount
