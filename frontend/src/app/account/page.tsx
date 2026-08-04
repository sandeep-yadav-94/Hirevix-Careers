"use client";

import Loading from '@/components/loading';
import { useAppData } from '@/context/AppContext'
import React from 'react'
import Info from './components/info';

const AccountPage = () => {
    const {isAuth, user, loading} = useAppData()
    if(loading) return <Loading/>
  return (
    <>{ user && <div className='w-[90%] md:w-[60%] m-auto'>
         <Info user={user} isYourAccount={true}/>
      </div>}</>
    )
}

export default AccountPage