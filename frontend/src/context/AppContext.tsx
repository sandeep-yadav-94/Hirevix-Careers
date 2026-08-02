"use client";

import React, { createContext, useContext, useState } from "react";
import {Toaster} from 'react-hot-toast'

interface User {
    user_id: number;
    name: string;
    email: string;
    phone_number: string;
    role: "jobseeker" | "recruiter";
    bio: string | null;
    resume: string | null;
    resume_public_id: string | null;
    profile_pic: string | null;
    profile_pic_public_id: string | null;
    skills: string[];
    subscription: string | null;
}

interface AppContextType {
    user: User | null;
    loading: boolean;
    btnLoading: boolean;
    isAuth: boolean;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
}

interface AppProviderProps {
    children: React.ReactNode;
}

export const utils_service = "http://localhost:4001";
export const auth_service = "http://localhost:4000";
export const user_service = "http://localhost:4002";
export const job_service = "http://localhost:4003";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<AppProviderProps> = ({children}) =>{
    const [user, setUser] = useState<User | null>(null)
    const [isAuth, setIsAuth] = useState(false)
    const [loading, setLoading] = useState(true)
    const [btnLoading, setBtnLoading] = useState(false)

    

    return <AppContext.Provider value={{user, loading, btnLoading, setUser, isAuth, setIsAuth, setLoading}}>
        {children}
        <Toaster/>
        </AppContext.Provider>
}

export const useAppData = (): AppContextType => {
    const context = useContext(AppContext);
    if(!context){
        throw new Error("useAppData must be used within AppProvider")
    }
    return context;
}