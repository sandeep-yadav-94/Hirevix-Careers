"use client";
import React, { FormEvent, useEffect, useState } from 'react'
import { auth_service, useAppData } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import Cookies  from 'js-cookie';
import { Label } from '@/components/ui/label';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/loading';


const LoginPage = () => {

    const [email, setEmail] = useState("")
    const[password, setPassword] = useState("")
    const [btnLoading, setBtnLoading] = useState(false)

    const {isAuth, setUser, loading, setIsAuth} = useAppData();
    const router = useRouter();

    useEffect(() => {
      if (isAuth) {
        router.replace('/');
      }
    }, [isAuth, router]);

    if(loading) return <Loading/>

    const submitHandler = async(e:FormEvent<HTMLFormElement>)=>{
      e.preventDefault();
      setBtnLoading(true);

      try {
        const {data} = await axios.post(`${auth_service}/api/auth/login`, {email, password});
        const userPayload = data?.user ?? data?.userObject ?? data?.registerdUser ?? data?.registeredUser ?? null;

        toast.success(data?.message || 'Signed in successfully');
        const token = data?.token;
        if (!token) {
          throw new Error("Login response did not include an authentication token.");
        }

        Cookies.set("token", token, {
          expires:15,
          secure: window.location.protocol === 'https:',
          sameSite:'lax',
          path:"/",
        })
        window.localStorage.setItem("token", token);
        if (userPayload) {
          window.localStorage.setItem("auth_user", JSON.stringify(userPayload));
        }
        setUser(userPayload);
        setIsAuth(true);
        router.push('/');
      } catch (error:any) {
        const errorMessage = axios.isAxiosError(error)
          ? (error.response?.data?.message || error.message)
          : 'Login failed. Please try again.';

        toast.error(errorMessage);
        setUser(null);
        setIsAuth(false);
      }finally{
        setBtnLoading(false);
      }

    }


    

  return <div className='min-h-screen flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold mb-2'>Welcome back to Hirevix</h1>
          <p className='text-sm opacity-70'>Sign to continue your journey</p>
        </div>
        <div className='border border-gray-400 rounded-2xl p-8 shadow-lg backdrop-blur-sm'>
          <form onSubmit={submitHandler} className='space-y-5'>

            <div className='space-y-2 '>
               <Label htmlFor='email' className='text-sm font-medium'>Email Address</Label>
               <div className="relative">
                <Mail className='icon-style'/>
                <Input type="email" id='email' placeholder='sandeep@gmail.com' value={email} onChange={e=>setEmail(e.target.value)} required className='pl-10 h-11' />
               </div>
            </div>

              <div className='space-y-2 '>
               <Label htmlFor='password' className='text-sm font-medium'>password</Label>
               <div className="relative">
                <Lock className='icon-style'/>
                <Input type="password" id='password' placeholder='*********' value={password} onChange={e=>setPassword(e.target.value)} required className='pl-10 h-11' />
               </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot" className='text-sm text-blue-500 hover:underline transition-all'>
                 Forgot Password
              </Link>
            </div>

            <Button type="submit" disabled={btnLoading} className="w-full">{btnLoading ? "Signing..." : "Sign In"} <ArrowRight size={18}/></Button>

          </form>

          <div className="mt-6 pt-6 border-t border-gray-400">
            <p className='text-center text-sm'>
              Don,t have an account? <Link href={'/register'} className='text-blue-500 font-medium hover:underline transition-all'>Create a new account</Link>
            </p>
          </div>

        </div>
      </div>
  </div>
  
}

export default LoginPage;
