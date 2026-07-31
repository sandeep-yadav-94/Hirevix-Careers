"use client"

import Link from "next/link";
import React, { useState } from 'react'
import { Button } from "./ui/button";
import { Briefcase, Ghost, Home, Info, LogOut, User, UserIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const NavBar = () => {

    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const isAuth = false;

    const logoutHandler = () => { };

    return <nav className='z-50 sticky top-0 bg-background/80 border-b backdrop-blur-md shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center ">
                    <Link href="/" className='flex items-center gap-1 group'>
                        <div className="text-2xl font-bold tracking-tight">
                            <span className='bg-linear-to-r from bg-blue-600  to-blue-800 bg-clip-text text-transparent'>Hire</span>
                            <span className='text-red-500 '>vix</span>
                        </div>
                    </Link>
                </div>

                {/* desktop navigation */}
                <div className="hidden md:flex items-center space-x-1 ">

                    <Link href={'/'} >
                        <Button variant={"ghost"} className="flex items-center gap-2 font-medium "><Home size={16} /> Home</Button>
                    </Link>

                    <Link href={'/jobs'} >
                        <Button variant={"ghost"} className="flex items-center gap-2 font-medium "><Briefcase size={16} /> Jobs</Button>
                    </Link>

                    <Link href={'/about'} >
                        <Button variant={"ghost"} className="flex items-center gap-2 font-medium "><Info size={16} /> About</Button>
                    </Link>
                </div>

                {/* Right side actions */}
                <div className="hidden md:flex items-center gap-3">
                    {isAuth ? (

                        <Popover>
                            <PopoverTrigger>
                                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                    <Avatar className="h-9 w-9 ring-2 ring-offset-2 ring-offset-background ring-blue-500/20 cursor-pointer hover:ring-blue-500/40 transition-all">
                                    {/* <AvatarImage src={} alt="" /> */}
                                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600">
                                        S
                                    </AvatarFallback>
                                    </Avatar>
                                </button>
                            </PopoverTrigger>

                            <PopoverContent className="w-56 p-2" align="end">
                                <div className="px-3 py-2 mb-2 border-b">
                                    <p className="text-sm font-semibold ">Sandeep</p>
                                    <p className="text-xs opacity-60 truncate">sandeep@gmail.com</p>
                                </div>
                                <Link href={'/account'} >
                                 <Button className="w-full justify-start gap-2" variant={"ghost"}><User size={15}/>My Profile</Button> 
                                </Link>
                                <Button className="w-full justify-start gap-2 mt-1" variant={"ghost"} onClick={logoutHandler}><LogOut size={16}/>Logout</Button>
                            </PopoverContent>
                        </Popover>

                        
                        ) : (<Link href={'/login'}><Button className="gap-2"><UserIcon size={16} />Sign In</Button></Link>)}
                </div>



            </div>
        </div>
    </nav>

}

export default NavBar