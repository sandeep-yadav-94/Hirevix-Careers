"use client"
import { job_service, useAppData } from '@/context/AppContext'
import React, { useEffect, useRef, useState } from 'react'
import Cookies from "js-cookie";
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '@/components/loading';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Building2, Plus, Trash2, UploadCloud, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Company as CompanyType } from '@/type';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

const Company = () => {
    const { loading } = useAppData();
    const addRef = useRef<HTMLButtonElement | null>(null);
    const openDialog = () => {
        addRef.current?.click();
    }

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [website, setWebsite] = useState("");
    const [logo, setLogo] = useState<File | null>(null);
    const [btnLoading, setBtnLoading] = useState(false);
    const [companies, setCompanies] = useState<CompanyType[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);

    const router = useRouter();

    const clearData = () => {
        setName("");
        setDescription("");
        setWebsite("");
        setLogo(null);
    };

    const fetchCompanies = async () => {
        try {
            const token =
                window.localStorage.getItem("token") || Cookies.get("token");

            if (!token) return;

            const { data } = await axios.get(
                `${job_service}/api/job/company/all`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setCompanies(data);
            console.log(data);
        } catch (error) {
            console.error(error);
        }
    };


    async function addCompanyHandler() {

        if (!name || !description || !website || !logo) {
            alert("Please fill all fields and upload company logo");
            return;
        }

        const formData = new FormData();

        formData.append("name", name);
        formData.append("description", description);
        formData.append("website", website);
        formData.append("logo", logo);

        try {
            setBtnLoading(true);

            const token =
                window.localStorage.getItem("token") || Cookies.get("token");

            if (!token) {
                alert("Please login first");
                return;
            }

            const { data } = await axios.post(
                `${job_service}/api/job/company/new`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,

                    },
                }
            );

            toast.success(data.message);

            clearData();

            fetchCompanies();

        } catch (error: any) {
            toast.error(error.response.data.message)
        } finally {
            setBtnLoading(false);
        }

    }


    async function deleteCompany(companyId: string) {
        try {
            setBtnLoading(true);

            const token =
                window.localStorage.getItem("token") || Cookies.get("token");

            if (!token) {
                alert("Please login first");
                return;
            }

            const { data } = await axios.delete(
                `${job_service}/api/job/company/${companyId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success(data.message);

            fetchCompanies();

        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || "Failed to delete company"
            );
        } finally {
            setBtnLoading(false);
        }
    }



    useEffect(() => {
        fetchCompanies();
    }, []);


    if (loading) return <Loading />

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <Card className="shadow-lg border-2 overflow-hidden">

                {/* Header */}
                <div className="bg-blue-500 p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">

                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <Building2 className="text-white" size={25} />
                            </div>

                            <div>
                                <CardTitle className="text-2xl text-white">
                                    My Companies
                                </CardTitle>

                                <CardDescription className="text-blue-100 mt-1">
                                    Manage your registered companies ({companies.length}/3)
                                </CardDescription>
                            </div>
                        </div>


                        <Button
                            onClick={() => setDialogOpen(true)}
                            className="gap-2 bg-white text-blue-600 hover:bg-blue-50"
                        >
                            <Plus size={18} />
                            Add Company
                        </Button>

                    </div>
                </div>


                {/* Companies */}
                <div className="p-6">

                    {companies.length === 0 ? (

                        <div className="flex flex-col items-center justify-center py-14 text-center">

                            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mb-5">
                                <Building2
                                    size={40}
                                    className="text-blue-600"
                                />
                            </div>

                            <h2 className="text-xl font-semibold">
                                No company added yet
                            </h2>

                            <p className="text-muted-foreground mt-2 max-w-md">
                                Start building your company profile by adding your
                                first company.
                            </p>

                            <Button
                                onClick={() => setDialogOpen(true)}
                                className="mt-5 gap-2"
                            >
                                <Plus size={18} />
                                Add Company
                            </Button>

                        </div>


                    ) : (

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {companies.map((c) => (
                                <div
                                    key={c.company_id}
                                    className="rounded-xl border p-5 hover:border-blue-500 transition-all bg-background"
                                >

                                    <div className="flex items-start gap-4">

                                        <div className="h-20 w-20 rounded-xl overflow-hidden border shrink-0">
                                            <img
                                                src={c.logo}
                                                alt={c.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>


                                        <div className="flex-1">

                                            <h3 className="text-xl font-semibold">
                                                {c.name}
                                            </h3>

                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                {c.description}
                                            </p>


                                            <a
                                                href={c.website}
                                                target="_blank"
                                                className="text-blue-600 text-sm hover:underline mt-2 block"
                                            >
                                                {c.website}
                                            </a>

                                        </div>

                                    </div>


                                    <div className="flex justify-end mt-5">


                                        <Button
                                            variant="outline"
                                            className="gap-2"
                                            onClick={() => router.push(`/company/${c.company_id}`)}
                                        >
                                            <Eye size={16} />
                                            View
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            className="gap-2"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this company?")) {
                                                    deleteCompany(c.company_id)
                                                }
                                            }}
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </Button>

                                    </div>


                                </div>
                            ))}

                        </div>

                    )}

                </div>

            </Card>



            {/* Add Company Dialog */}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>

                <DialogContent>

                    <DialogHeader>
                        <DialogTitle>
                            Add New Company
                        </DialogTitle>
                    </DialogHeader>


                    <div className="space-y-4">


                        <input
                            className="w-full border rounded-lg p-3"
                            placeholder="Company Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />


                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Company Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />


                        <input
                            className="w-full border rounded-lg p-3"
                            placeholder="Website"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                        />


                        <label className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer">

                            <UploadCloud size={20} />

                            <span>
                                Upload Logo
                            </span>

                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) =>
                                    setLogo(e.target.files?.[0] || null)
                                }
                            />

                        </label>


                        <Button
                            className="w-full"
                            disabled={btnLoading}
                            onClick={async () => {
                                await addCompanyHandler();
                                setDialogOpen(false);
                            }}
                        >
                            {btnLoading ? "Adding..." : "Add Company"}
                        </Button>


                    </div>

                </DialogContent>

            </Dialog>

        </div>
    )
}

export default Company