"use client";

import Loading from '@/components/loading';
import { useAppData } from '@/context/AppContext'
import React from 'react'
import { Sparkles, ShieldCheck, BriefcaseBusiness } from 'lucide-react';
import Info from './components/info';
import Skills from './components/skills';
import Company from './components/company';
import Applications from './components/applications';
import ApplicantInbox from './components/applicant-inbox';
import Dashboard from './components/dashboard';

const AccountPage = () => {
    const { user, loading } = useAppData()
    if (loading) return <Loading/>
    if (!user) return null;

    const isRecruiter = user.role === 'recruiter';
    const isJobSeeker = user.role === 'jobseeker';

    return (
        <div className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_48%),linear-gradient(135deg,_#f8fbff_0%,_#f5f7fb_100%)] px-4 py-6 sm:px-6 lg:px-8'>
            <div className='mx-auto flex max-w-7xl flex-col gap-6'>
                <section className='overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/85 p-6 shadow-[0_30px_80px_-30px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-8'>
                    <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
                        <div className='max-w-2xl space-y-4'>
                            <div className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600'>
                                <Sparkles size={16} className='text-blue-600' />
                                {isRecruiter ? 'Recruiter workspace' : isJobSeeker ? 'Job seeker dashboard' : 'Account center'}
                            </div>
                            <div className='space-y-3'>
                                <h1 className='text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl'>
                                    {isRecruiter ? 'Run your hiring pipeline with clarity and confidence.' : 'Present your profile and opportunities with a premium experience.'}
                                </h1>
                                <p className='text-base leading-7 text-slate-600'>
                                    {isRecruiter
                                        ? 'Manage your company profile, hiring moments, and outreach in a calm, professional workspace.'
                                        : 'Keep your profile polished, track your applications, and highlight the skills that matter most.'}
                                </p>
                            </div>
                        </div>

                        <div className='flex flex-wrap gap-3'>
                            <div className='rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3'>
                                <div className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Account type</div>
                                <div className='mt-1 text-sm font-semibold capitalize text-slate-900'>{user.role}</div>
                            </div>
                            <div className='rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3'>
                                <div className='text-[11px] uppercase tracking-[0.24em] text-slate-500'>Status</div>
                                <div className='mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-600'>
                                    <ShieldCheck size={16} />
                                    Verified
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className='grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
                    <div className='rounded-[24px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_-30px_rgba(2,6,23,0.3)]'>
                        <div className='flex items-center gap-3'>
                            <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600'>
                                <BriefcaseBusiness size={20} />
                            </div>
                            <div>
                                <p className='text-sm font-semibold text-slate-900'>Your workspace</p>
                                <p className='text-sm text-slate-500'>Everything you need, in one place</p>
                            </div>
                        </div>
                        <div className='mt-5 grid gap-3 sm:grid-cols-2'>
                            <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4'>
                                <p className='text-sm font-semibold text-slate-900'>Profile completeness</p>
                                <p className='mt-2 text-2xl font-semibold text-slate-950'>96%</p>
                                <p className='mt-1 text-sm text-slate-500'>A strong signal for recruiters and employers.</p>
                            </div>
                            <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4'>
                                <p className='text-sm font-semibold text-slate-900'>Focus mode</p>
                                <p className='mt-2 text-2xl font-semibold text-slate-950'>Always on</p>
                                <p className='mt-1 text-sm text-slate-500'>Clean layout designed for decisive actions.</p>
                            </div>
                        </div>
                    </div>

                    <div className='rounded-[24px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_20px_60px_-30px_rgba(2,6,23,0.45)]'>
                        <p className='text-sm font-semibold text-slate-300'>Premium experience</p>
                        <h2 className='mt-2 text-2xl font-semibold'>Built for modern hiring teams</h2>
                        <p className='mt-3 text-sm leading-7 text-slate-300'>A refined dashboard tailored to the way ambitious professionals and recruiters work every day.</p>
                    </div>
                </section>

                <div className='space-y-6'>
                    <Dashboard />
                    <Info user={user} isYourAccount={true}/>
                    {user.role === 'jobseeker' && <Skills user={user} isYourAccount={true} />}
                    {user.role === 'jobseeker' && <Applications />}
                    {user.role === 'recruiter' && <div id="companies"><Company /></div>}
                    {user.role === 'recruiter' && <ApplicantInbox />}
                </div>
            </div>
        </div>
    )
}

export default AccountPage
