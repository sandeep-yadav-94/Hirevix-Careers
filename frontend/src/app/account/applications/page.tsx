"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAppData, user_service } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

interface Application {
  application_id: number;
  job_id: number;
  applicant_id: number;
  applicant_email: string;
  status: string;
  resume: string;
  applied_at: string;
  subscribed: boolean;
  job_title: string;
  job_salary: number | null;
  job_location: string;
}

export default function MyApplicationsPage() {
  const { user, loading } = useAppData();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const prevRef = useRef<Record<number, string>>({});

  const fetchApplications = async () => {
    setLoadingData(true);
    try {
      const token = window.localStorage.getItem("token") || undefined;
      const { data } = await axios.get(`${user_service}/api/user/application/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const apps: Application[] = Array.isArray(data) ? data : [];

      // detect changes
      const prev = prevRef.current || {};
      apps.forEach((app) => {
        const prevStatus = prev[app.application_id];
        if (prevStatus && prevStatus !== app.status) {
          toast(`Application #${app.application_id} (${app.job_title}) status updated: ${prevStatus} → ${app.status}`);
        }
        prev[app.application_id] = app.status;
      });
      prevRef.current = prev;

      setApplications(apps);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load applications");
      setApplications([]);
    } finally {
      setLoadingData(false);
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

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in to view your applications.</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Applications</h1>

        {loadingData && <div className="text-sm text-slate-500 mb-4">Refreshing...</div>}

        {applications.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center">
            <p className="text-lg font-semibold">No applications yet</p>
            <p className="text-sm text-slate-500 mt-2">Apply to jobs to see them appear here.</p>
            <div className="mt-6">
              <Button onClick={() => (window.location.href = '/jobs')}>Browse jobs</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.application_id} className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{app.job_title}</p>
                    <p className="text-sm text-slate-500">{app.job_location} • ₹{app.job_salary ?? '—'}</p>
                    <p className="text-xs text-slate-400 mt-1">Applied on {new Date(app.applied_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Status</p>
                    <p className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{app.status}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-700">
                  <p>Resume: <a href={app.resume} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
