"use client"

import Link from "next/link";
import React, { useState } from 'react'
import { Button } from "./ui/button";
import { Briefcase, Ghost, Home, Info, LogOut, Menu, User, UserIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ModeToggle } from "./mode-toggle";

const NavBar = () => {

    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const isAuth = true; 

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

                    <Link href={'/'} className="inline-flex items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                        <Home size={16} /> Home
                    </Link>

                    <Link href={'/jobs'} className="inline-flex items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                        <Briefcase size={16} /> Jobs
                    </Link>

                    <Link href={'/about'} className="inline-flex items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                        <Info size={16} /> About
                    </Link>
                </div>

                {/* Right side actions */}
                <div className="hidden md:flex items-center gap-3">
                    {isAuth ? (

                        <Popover>
                            <PopoverTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                <Avatar className="h-9 w-9 ring-2 ring-offset-2 ring-offset-background ring-blue-500/20 cursor-pointer hover:ring-blue-500/40 transition-all">
                                {/* <AvatarImage src={} alt="" /> */}
                                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600">
                                    S
                                </AvatarFallback>
                                </Avatar>
                            </PopoverTrigger>

                            <PopoverContent className="w-56 p-2" align="end">
                                <div className="px-3 py-2 mb-2 border-b">
                                    <p className="text-sm font-semibold ">Sandeep</p>
                                    <p className="text-xs opacity-60 truncate">sandeep@gmail.com</p>
                                </div>
                                <Link href={'/account'} className="inline-flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                                    <User size={15}/>My Profile
                                </Link>
                                <Button className="w-full justify-start gap-2 mt-1" variant={"ghost"} onClick={logoutHandler}><LogOut size={16}/>Logout</Button>
                            </PopoverContent>
                        </Popover>

                        
                        ) : (
                            <Link href={'/login'} className="inline-flex items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                                <UserIcon size={16} />
                                Sign In
                            </Link>
                        )}
                        <ModeToggle/>
                </div>
               {/* mobile menu butto  */}
                <div className="md:hidden flex items-center gap-2">
                    <ModeToggle/>
                    <button onClick={toggleMenu} className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" aria-label="Toggle menu">
                        {isOpen ? (<X size={20} />) : (<Menu size={20} />)}
                        <span className="sr-only">Open main menu</span>
                    </button>
                </div>


            </div>
        </div>

        {/* mobile view */}

        <div className={`md:hidden border-t overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {/* isAuth or user */}
                <Link href={'/'} onClick={toggleMenu} className="inline-flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    <Home size={16} /> Home
                </Link> 
                <Link href={'/jobs'} onClick={toggleMenu} className="inline-flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    <Briefcase size={16} /> Jobs
                </Link>
                <Link href={'/about'} onClick={toggleMenu} className="inline-flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    <Info size={16} /> About
                </Link>

                {
                    isAuth ? (
                        <>
                        <Link href={'/account'} onClick={toggleMenu} className="inline-flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                            <User size={18} /> My Profile
                        </Link>
                        <Button variant={"destructive"} className="w-full justify-start gap-3 h-11" onClick={() => {logoutHandler(); toggleMenu()}}>
                            <LogOut size={18} /> LogOut
                        </Button>
                        </>
                    ) : (
                        <Link href={'/login'} onClick={toggleMenu} className="inline-flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted h-11">
                            <UserIcon size={18} /> Sign In
                        </Link>
                    )
                }
               
            </div>
        </div>

    </nav>

}

export default NavBar