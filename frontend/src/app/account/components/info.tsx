import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppData } from '@/context/AppContext'
import { AccountProps } from '@/type'
import { Briefcase, Camera, Edit, FileText, Mail, NotebookText, Phone, UserIcon, Sparkles, BadgeCheck } from 'lucide-react'
import Subscription from './subscription'
import Link from 'next/link'
import React, { ChangeEvent, useRef, useState } from 'react'

const Info: React.FC<AccountProps> = ({user, isYourAccount}) => {
   
   const inputRef = useRef<HTMLInputElement | null>(null)
   const editRef = useRef<HTMLButtonElement | null>(null)
   const resumeRef = useRef<HTMLInputElement | null>(null)

   const [name, setName] = useState("")
   const [phoneNumber, setPhoneNumber] = useState("")
   const [bio, setBio] = useState("")
   const {updateProfilePic, updateResume, btnLoading, updateUser} = useAppData();

   const handleClick = () => {
      inputRef.current?.click();
   }

   const changeHandler = (e: ChangeEvent<HTMLInputElement>) =>{
      const file = e.target.files?.[0];
      if(file){
         const formData = new FormData()
         formData.append("file", file)
         updateProfilePic(formData);
      }
   }

   const handleEditClick = () => {
      editRef.current?.click();
      setName(user.name)
      setPhoneNumber(user.phone_number)
      setBio(user.bio || "")
   }

   const updateProfileHandler = () => {
      updateUser(name, phoneNumber,bio);
   };

   const handleResumeClick = () => {
      resumeRef.current?.click();
   }

   const changeResume = (e:ChangeEvent<HTMLInputElement>)=>{
       const file = e.target.files?.[0];
      if(file){
         if(file.type !== "application/pdf"){
            alert("Please upload a pdf file");
            return;
         }
         const formData = new FormData()
         formData.append("file", file);
         updateResume(formData)
      }
   }

  return (
    <div className='mx-auto max-w-5xl'>
        <Card className='overflow-hidden border border-slate-200/80 bg-white shadow-[0_24px_80px_-30px_rgba(2,6,23,0.25)]'>
          <div className='relative h-28 overflow-hidden bg-[linear-gradient(135deg,_#2563eb_0%,_#1d4ed8_50%,_#0f172a_100%)] sm:h-36'>
             <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_42%)]' />
             <div className='absolute -bottom-0 left-5 flex items-end gap-4 sm:left-10'>
                <div className='relative'>
                   <div className='h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-2xl sm:h-36 sm:w-36'>
                      <img src={user.profile_pic ? user.profile_pic : "/user-avatar.webp"} alt={user.name} className='h-full w-full object-cover'/>
                   </div>

                   {isYourAccount && (
                      <>
                        <Button variant={'secondary'} size={'icon'} onClick={handleClick} className='absolute bottom-1 right-1 h-10 w-10 rounded-full shadow-lg'>
                           <Camera size={18} />
                        </Button>
                        <input type="file" className='hidden' accept='image/*' ref={inputRef} onChange={changeHandler} />
                      </>
                   )}
                </div>
                <div className='hidden pb-3 sm:block'>
                  <div className='inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-sm font-medium text-white backdrop-blur'>
                     <Sparkles size={14} />
                     {isYourAccount ? 'Your profile' : 'Professional profile'}
                  </div>
                </div>
             </div>
          </div>

          <div className='px-4 pb-6 pt-16 sm:px-8 sm:pb-8 sm:pt-24'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
               <div className='space-y-3'>
                  <div className='flex items-center gap-3'>
                     <div>
                        <h1 className='text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl'>{user.name}</h1>
                        <div className='mt-2 flex items-center gap-2 text-sm font-medium text-slate-600'>
                           <Briefcase size={16} className='text-blue-600' />
                           <span className='capitalize'>{user.role}</span>
                           <span className='flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700'>
                              <BadgeCheck size={12} />
                              Active
                           </span>
                        </div>
                     </div>
                     {isYourAccount && (
                        <Button variant={'ghost'} size={'icon'} className='h-9 w-9 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100' onClick={handleEditClick}><Edit size={16} /></Button>
                     )}
                  </div>
               </div>
            </div>

            {user.role === 'jobseeker' && user.bio && (
               <div className='mt-6 rounded-[20px] border border-slate-200 bg-slate-50/80 p-4 sm:mt-8 sm:rounded-[24px] sm:p-5'>
                  <div className='mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700'>
                     <FileText size={16} className='text-blue-600' />
                     <span>About</span>
                  </div>
                  <p className='text-base leading-7 text-slate-600'>{user.bio}</p>
               </div>
            )}

            <div className='mt-6 sm:mt-8'>
               <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900'>
                  <Mail size={20} className='text-blue-600' />
                  Contact details
               </h2>
               <div className='grid gap-4 md:grid-cols-2'>
                  <div className='flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300'>
                     <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600'>
                        <Mail size={18} />
                     </div>
                     <div className='min-w-0 flex-1'>
                        <p className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-500'>Email</p>
                        <p className='mt-1 truncate text-sm font-medium text-slate-700'>{user.email}</p>
                     </div>
                  </div>

                  <div className='flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300'>
                     <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700'>
                        <Phone size={18} />
                     </div>
                     <div className='min-w-0 flex-1'>
                        <p className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-500'>Phone</p>
                        <p className='mt-1 truncate text-sm font-medium text-slate-700'>{user.phone_number}</p>
                     </div>
                  </div>
               </div>
            </div>

            {user.role === 'jobseeker' && user.resume && (
               <div className='mt-6 sm:mt-8'>
                  <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900'>
                     <NotebookText size={20} className='text-blue-600' />
                     Resume
                  </h2>
                  <div className='flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 sm:flex-row sm:items-center sm:justify-between'>
                     <div className='flex items-center gap-3'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600'>
                           <NotebookText size={20} />
                        </div>
                        <div>
                           <p className='text-sm font-semibold text-slate-900'>Resume document</p>
                           <Link href={user.resume} className='text-sm text-blue-600 hover:underline' target='_blank'>Open PDF</Link>
                        </div>
                     </div>
                     <Button variant={'outline'} size={'sm'} onClick={handleResumeClick} className='gap-2'>Update</Button>
                     <input type='file' ref={resumeRef} className='hidden' accept='application/pdf' onChange={changeResume}/>
                  </div>
                  {isYourAccount && <Subscription user={user} />}
               </div>
            )}
          </div>
        </Card>

        <Dialog>
          <DialogTrigger >
             <Button ref={editRef} variant={'outline'} className='hidden'>Edit profile</Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-125'>
            <DialogHeader>
               <DialogTitle className='text-2xl'>
                  Edit profile
               </DialogTitle>
            </DialogHeader>
            <div className='space-y-5 py-4'>
               <div className='space-y-2'>
                  <Label htmlFor='name' className='flex items-center gap-2 text-sm font-medium'>
                     <UserIcon size={16}/>
                     Full name
                  </Label>
                  <Input id='name' type='text' placeholder='Sandeep yadav' className='h-11' value={name} onChange={e=>setName(e.target.value)} />
               </div>

               <div className='space-y-2'>
                  <Label htmlFor='phone' className='flex items-center gap-2 text-sm font-medium'>
                     <Phone size={16}/>
                     Phone number
                  </Label>
                  <Input id='phone' type='number' placeholder='Enter your phone number' className='h-11' value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} />
               </div>

               {user.role === 'jobseeker' && (
                  <div className='space-y-2'>
                     <Label htmlFor='bio' className='flex items-center gap-2 text-sm font-medium'>
                        <FileText size={16}/>
                        Bio
                     </Label>
                     <Input id='bio' type='text' placeholder='Enter your bio' className='h-11' value={bio} onChange={e=>setBio(e.target.value)} />
                  </div>
               )}

               <DialogFooter>
                  <Button disabled={btnLoading} onClick={updateProfileHandler} className='h-11 w-full' type='submit'>
                     {btnLoading ? 'Saving Changes...' : 'Update Profile'}
                  </Button>
               </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  )
}

export default Info
