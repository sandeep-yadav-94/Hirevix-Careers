"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import toast, {Toaster} from 'react-hot-toast'
import Cookies from "js-cookie";
import axios from "axios";

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
    logoutUser: () => Promise<void>;

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

    async function fetchUser() {
        const token = window.localStorage.getItem("token") || Cookies.get("token");

        if (!token) {
            setUser(null);
            setIsAuth(false);
            setLoading(false);
            return;
        }

        try {
            const {data} = await axios.get(`${user_service}/api/user/me`, {
                headers:{
                    Authorization: `Bearer ${token}`,
                },
            });
            setUser(data)
            setIsAuth(true);
            window.localStorage.setItem("auth_user", JSON.stringify(data));
        } catch (error) {
            console.log(error)
            const status = axios.isAxiosError(error) ? error.response?.status : undefined;

            // Only an explicit authentication rejection ends a saved session.
            // Network/database failures must not log a user out on refresh.
            if (status === 401 || status === 403) {
                Cookies.remove("token", { path: "/" });
                window.localStorage.removeItem("token");
                window.localStorage.removeItem("auth_user");
                setUser(null);
                setIsAuth(false);
            }
        }finally{
            setLoading(false);
        }
    }


  async function logoutUser(){
        // Remove every persisted client-side credential/profile so a reload
        // cannot restore the previously authenticated user.
        Cookies.remove("token", { path: "/" });
        Cookies.remove("token");
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("auth_user");
        setUser(null);
        setIsAuth(false);
        setLoading(false);
        toast.success("Logged out successfully..")
    }

    useEffect(() => {
        const cachedUser = window.localStorage.getItem("auth_user");
        const token = window.localStorage.getItem("token") || Cookies.get("token");

        if (token && cachedUser) {
            try {
                setUser(JSON.parse(cachedUser));
                setIsAuth(true);
            } catch {
                window.localStorage.removeItem("auth_user");
            }
        }

        fetchUser();
    }, [])

    return <AppContext.Provider value={{user, loading, btnLoading, setUser, isAuth, setIsAuth, setLoading, logoutUser}}>
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
