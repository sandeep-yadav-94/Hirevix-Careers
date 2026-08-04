"use client";
import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { auth_service, useAppData } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import Cookies  from 'js-cookie';
import { Label } from '@/components/ui/label';
import { ArrowRight, Briefcase, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/loading';


const RegisterPage = () => {

    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [bio, setBio] = useState("");
    const [resume, setResume] = useState<File | null>(null);
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

      const formData = new FormData();
      formData.append("role", role)
      formData.append("name",name)
      formData.append("email",email)
      formData.append("password",password)
      formData.append("phoneNumber",phoneNumber)

      if(role === "jobseeker"){
        formData.append("bio", bio);
        if(resume){
          formData.append("File", resume);
        }
      }


      try {
        const {data} = await axios.post(`${auth_service}/api/auth/register`, formData);
        const userPayload = data?.user ?? data?.userObject ?? data?.registerdUser ?? data?.registeredUser ?? null;

        toast.success(data?.message || 'Registration successful');
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
          : 'Registered failed. Please try again.';

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
          <h1 className='text-4xl font-bold mb-2'>Jion Hirevix</h1>
          <p className='text-sm opacity-70'>Create your Hirevix account</p>
        </div>
        <div className='border border-gray-400 rounded-2xl p-8 shadow-lg backdrop-blur-sm'>
          <form onSubmit={submitHandler} className='space-y-5'>


             <div className='space-y-2 '>
               <Label htmlFor='role' className='text-sm font-medium'>I want to</Label>
               <div className="relative">
                <Briefcase className='icon-style'/>
                <select  id="role" value={role} onChange={(e: ChangeEvent<HTMLSelectElement>)=>setRole(e.target.value)} className='w-full h-11 pl-10 pr-4 border-2 border-gray-300 rounded-md bg-transparent ' required>
                  <option value="">Select your role</option>
                  <option value="jobseeker">Find a job</option>
                  <option value="recruiter">Hire a Talent</option>
                </select>
               </div>
            </div>


           {
            role && <div className="space-y-5 animate-in fade-in duration-300">

               <div className='space-y-2 '>
               <Label htmlFor='name' className='text-sm font-medium'>Full name</Label>
               <div className="relative">
                <Mail className='icon-style'/>
                <Input type="text" id='name' placeholder='sandeep yadav' value={name} onChange={e=>setName(e.target.value)} required className='pl-10 h-11' />
               </div>
            </div>

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

             <div className='space-y-2 '>
               <Label htmlFor='phone' className='text-sm font-medium'>Phone Number</Label>
               <div className="relative">
                <Mail className='icon-style'/>
                <Input type="number" id='phone' placeholder='+91 123456789' value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} required className='pl-10 h-11' />
               </div>
            </div>

            {
              role === "jobseeker" && <div className="space-y-5 pt-4 border-t border-gray-400">
                 <div className='space-y-2 '>
               <Label htmlFor='resume' className='text-sm font-medium'>Resume (PDF)</Label>
               <div className="relative">
                <Mail className='icon-style'/>
                <Input type="file" id='resume' accept="application/pdf" onChange={e=>{
                  if(e.target.files && e.target.files[0]){
                    setResume(e.target.files[0])
                  }
                }} className='cursor-pointer h-11' />
               </div>
            </div>

             <div className='space-y-2 '>
               <Label htmlFor='bio' className='text-sm font-medium'>Bio</Label>
               <div className="relative">
                <Mail className='icon-style'/>
                <Input type="text" id='bio' placeholder='tell us about yourself for better understanding..' value={bio} onChange={e=>setBio(e.target.value)} required className='pl-10 h-11' />
               </div>
            </div>
              </div>
            }


             <Button type="submit" disabled={btnLoading} className="w-full">{btnLoading ? "Please wait..." : "Register"} <ArrowRight size={18}/></Button>
            </div>
           }

           

           

          </form>

          <div className="mt-6 pt-6 border-t border-gray-400">
            <p className='text-center text-sm'>
              Already have an account? <Link href={'/login'} className='text-blue-500 font-medium hover:underline transition-all'>Login</Link>
            </p>
          </div>

        </div>
      </div>
  </div>
  
}

export default RegisterPage;
