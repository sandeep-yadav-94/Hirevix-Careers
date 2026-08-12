"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAppData, user_service } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Clock3, FileText, Sparkles, ArrowUpRight } from "lucide-react";

export default function AccountApplications() {
  const { user, loading } = useAppData();
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const prevRef = useRef<Record<number, string>>({});

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const token = window.localStorage.getItem("token");
      const { data } = await axios.get(`${user_service}/api/user/application/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const apps = Array.isArray(data) ? data : [];

      const prev = prevRef.current || {};
      apps.forEach((app: any) => {
        const prevStatus = prev[app.application_id];
        if (prevStatus && prevStatus !== app.status) {
          toast(`Status changed for ${app.job_title}: ${prevStatus} → ${app.status}`);
        }
        prev[app.application_id] = app.status;
      });
      prevRef.current = prev;

      setApplications(apps);
    } catch (err: any) {
      console.error(err);
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    let timer: any = null;
    if (user && user.role === "jobseeker") {
      fetchApplications();
      timer = setInterval(fetchApplications, 10000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user]);

  if (loading) return <div className='mx-auto max-w-5xl rounded-[24px] border border-slate-200 bg-white/80 p-8 text-sm text-slate-500 shadow-sm'>Loading profile...</div>;
  if (!user) return null;

  const statusClasses = {
    Hired: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Rejected: 'border-rose-200 bg-rose-50 text-rose-700',
    default: 'border-slate-200 bg-slate-50 text-slate-700',
  } as const;

  return (
    <div className='mx-auto max-w-5xl'>
      <Toaster />
      <div className='rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_24px_80px_-30px_rgba(2,6,23,0.2)] sm:rounded-[28px] sm:p-8'>
        <div className='flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <div className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600'>
              <Sparkles size={15} className='text-blue-600' />
              Application center
            </div>
            <h2 className='mt-3 text-xl font-semibold text-slate-950 sm:text-2xl'>My applications & messages</h2>
            <p className='mt-2 text-sm leading-7 text-slate-600'>Stay on top of each step without losing context.</p>
          </div>
          <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'>
            <span className='font-semibold text-slate-900'>{applications.length}</span> total applications
          </div>
        </div>

        <div className='mt-6 space-y-4'>
          {loadingApps ? (
            <div className='space-y-3'>
              {[1, 2].map((item) => (
                <div key={item} className='animate-pulse rounded-[22px] border border-slate-200 bg-slate-50 p-5'>
                  <div className='h-4 w-28 rounded bg-slate-200' />
                  <div className='mt-3 h-3 w-40 rounded bg-slate-200' />
                  <div className='mt-3 h-3 w-24 rounded bg-slate-200' />
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className='rounded-[24px] border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white p-10 text-center shadow-sm'>
              <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600'>
                <FileText size={24} />
              </div>
              <p className='mt-4 text-xl font-semibold text-slate-900'>You haven't applied yet</p>
              <p className='mt-2 text-sm leading-7 text-slate-500'>Apply to jobs to track status updates and messages from recruiters.</p>
              <div className='mt-6'>
                <Button onClick={() => (window.location.href = '/jobs')} className='gap-2'>Browse jobs <ArrowUpRight size={16} /></Button>
              </div>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-4'>
              {applications.map((a) => (
                <div key={a.application_id} className='rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 sm:rounded-[24px] sm:p-5'>
                  <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                    <div className='space-y-2'>
                      <p className='text-lg font-semibold text-slate-900'>{a.job_title}</p>
                      <p className='text-sm text-slate-600'>{a.job_location} • ₹{a.job_salary ?? '—'}</p>
                      <div className='flex items-center gap-2 text-sm text-slate-500'>
                        <Clock3 size={15} />
                        <span>Applied on {new Date(a.applied_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className='md:text-right'>
                      <div className='flex flex-wrap items-center justify-start gap-3 md:justify-end'>
                        <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[a.status as keyof typeof statusClasses] || statusClasses.default}`}>
                          {a.status}
                        </div>
                        <a href={a.resume} target='_blank' rel='noreferrer' className='inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline'>View Resume <ArrowUpRight size={14} /></a>
                      </div>

                      {a.recruiter_note && (
                        <div className='mt-3 rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-left md:text-right'>
                          <p className='text-sm font-semibold text-slate-900'>Message from recruiter</p>
                          <p className='mt-1 text-sm leading-7 text-slate-600'>{a.recruiter_note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
