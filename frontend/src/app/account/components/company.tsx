"use client"
import { job_service, useAppData } from '@/context/AppContext'
import React, { useEffect, useRef, useState } from 'react'
import Cookies from "js-cookie";
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '@/components/loading';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Building2, Plus, Trash2, UploadCloud, Eye, ArrowUpRight, Sparkles } from 'lucide-react';
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
        <div className="mx-auto max-w-7xl py-2 sm:px-4">
            <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-[0_24px_80px_-30px_rgba(2,6,23,0.2)]">
                <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fbff_100%)] p-4 sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-slate-950 sm:text-2xl">My companies</CardTitle>
                                <CardDescription className="mt-1 text-sm text-slate-600">Manage your registered companies ({companies.length}/3)</CardDescription>
                            </div>
                        </div>

                        <Button
                            onClick={() => setDialogOpen(true)}
                            className="w-full gap-2 bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"
                        >
                            <Plus size={18} />
                            Add company
                        </Button>
                    </div>
                </div>

                <div className="p-4 sm:p-8">
                    {companies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 py-16 text-center">
                            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <Building2 size={38} />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900">No company added yet</h2>
                            <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">Start building your company profile by adding your first company.</p>
                            <Button onClick={() => setDialogOpen(true)} className="mt-6 gap-2"> <Plus size={18} /> Add company </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {companies.map((c) => (
                                <div key={c.company_id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 sm:rounded-[24px] sm:p-5">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:h-20 sm:w-20">
                                            <img src={c.logo} alt={c.name} className="h-full w-full object-cover" />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-lg font-semibold text-slate-950 sm:text-xl">{c.name}</h3>
                                                <div className='inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700'>
                                                    <Sparkles size={12} />
                                                    Live
                                                </div>
                                            </div>
                                            <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-600">{c.description}</p>
                                            <a href={c.website} target="_blank" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                                                {c.website}
                                                <ArrowUpRight size={14} />
                                            </a>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                                        <Button variant="outline" className="gap-2" onClick={() => router.push(`/company/${c.company_id}`)}>
                                            <Eye size={16} />
                                            View
                                        </Button>

                                        <Button variant="destructive" className="gap-2" onClick={() => {
                                            if (confirm("Are you sure you want to delete this company?")) {
                                                deleteCompany(c.company_id)
                                            }
                                        }}>
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className='text-2xl'>Add new company</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <input
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                            placeholder="Company name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <textarea
                            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                            placeholder="Company description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        <input
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                            placeholder="Website"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                        />

                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-white">
                            <UploadCloud size={20} />
                            <span>{logo ? logo.name : 'Upload logo'}</span>
                            <input type='file' hidden accept='image/*' onChange={(e) => setLogo(e.target.files?.[0] || null)} />
                        </label>

                        <Button className="w-full" disabled={btnLoading} onClick={async () => {
                            await addCompanyHandler();
                            setDialogOpen(false);
                        }}>
                            {btnLoading ? 'Adding...' : 'Add company'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Company
