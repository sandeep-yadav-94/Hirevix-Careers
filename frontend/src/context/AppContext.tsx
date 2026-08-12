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
   updateProfilePic: (FormData:any) => Promise<void>
   updateResume: (FormData:any) => Promise<void>
   updateUser: (name:string, phoneNumber:string, bio:string) => Promise<void>
   addSkill: (skill:string) => Promise<void>
   removeSkill:(skill:string) => Promise<void>

}

interface AppProviderProps {
    children: React.ReactNode;
}

export const utils_service = "http://localhost:4001";
export const auth_service = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:4000";
export const user_service = process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:4002";
export const job_service = "http://localhost:4003";
export const payment_service = "http://localhost:4004";

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


async function updateProfilePic(formData:any) {
    setLoading(true);
    const token = window.localStorage.getItem("token") || Cookies.get("token");

    try {
        const {data} = await axios.put(`${user_service}/api/user/update/pic`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        toast.success(data.message);
        fetchUser();

    } catch (error:any) {
        toast.error(error?.response?.data?.message || "Failed to update profile picture");
        throw error;
    }finally{
        setLoading(false);
    }
}


async function updateResume(formData:any) {
    setLoading(true);
    const token = window.localStorage.getItem("token") || Cookies.get("token");

    try {
        const {data} = await axios.put(`${user_service}/api/user/update/resume`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        toast.success(data.message);
        fetchUser();

    } catch (error:any) {
        toast.error(error?.response?.data?.message || "Failed to update profile picture");
        throw error;
    }finally{
        setLoading(false);
    }
}

async function updateUser(name:string, phoneNumber:string, bio:string) {
    setBtnLoading(true);
    const token = window.localStorage.getItem("token") || Cookies.get("token");
    try {
        const {data} = await axios.put(`${user_service}/api/user/update/profile`, {name, phoneNumber, bio}, {
            headers:{
                Authorization: `Bearer ${token}`,
            },
        })
        toast.success(data.message);
        fetchUser();
    } catch (error:any) {
        toast.error(error.response.data.message);
    }finally{
        setBtnLoading(false);
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

    async function addSkill(skill:string) {
        setBtnLoading(true)
        const token = window.localStorage.getItem("token") || Cookies.get("token");
        try {
            const {data} = await axios.post(`${user_service}/api/user/skill/add`, {skillName:skill}, {
                headers:{
                    Authorization: `Bearer ${token}`,
                },
            })
            toast.success(data.message);
            fetchUser();
        } catch (error:any) {
            toast.error(error.response.data.message);
        }finally{
            setBtnLoading(false);
        }
    }


     async function removeSkill(skill:string) {
        
        const token = window.localStorage.getItem("token") || Cookies.get("token");
        try {
            const {data} = await axios.put(`${user_service}/api/user/skill/delete`, {skillName:skill}, {
                headers:{
                    Authorization: `Bearer ${token}`,
                },
            })
            toast.success(data.message);
            fetchUser();
        } catch (error:any) {
            toast.error(error.response.data.message);
        }
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

    return <AppContext.Provider value={{user, loading, btnLoading, setUser, isAuth, setIsAuth, setLoading, logoutUser, updateProfilePic, updateResume, updateUser, addSkill, removeSkill}}>
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
