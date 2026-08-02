"use client";

import { AppContextType, AppProviderProps, User } from "@/type";
import { createContext, useContext, useState } from "react";

export const utils_service = "http://localhost:4001";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<AppProviderProps> = ({children}) =>{
    const [user, setUser] = useState<User | null>(null)
    const [isAuth, setIsAuth] = useState(false)
    const [loading, setLoading] = useState(true)
    const [btnLoading, setBtnLoading] = useState(false)

    return <AppContext.Provider value={{user, loading, btnLoading, setUser, isAuth, setIsAuth, setLoading}}>{children}</AppContext.Provider>
}

export const useAppData = (): AppContextType => {
    const context = useContext(AppContext);
    if(!context){
        throw new Error("useAppData must be used within AppProvider")
    }
    return context;
}