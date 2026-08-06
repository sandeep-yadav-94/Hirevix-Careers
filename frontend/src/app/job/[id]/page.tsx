"use client";

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { job_service, useAppData, user_service } from '@/context/AppContext';
import { Job } from '@/type';
import { Button } from '@/components/ui/button';
import Loading from '@/components/loading';
import { Briefcase, MapPin, IndianRupee, Users, Globe, ArrowLeft } from 'lucide-react';

const JobDetailPage = () => {
  const params = useParams();
  const jobId = params.id;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const { user } = useAppData();

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${job_service}/api/job/${jobId}`);
      setJob(data && !Array.isArray(data) ? data : null);
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message || 'Failed to load job details' : 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) void fetchJob();
  }, [fetchJob, jobId]);

  const applyForJob = async () => {
    if (!job) return;
    if (!user) {
      toast.error('Please sign in as a job seeker to apply.');
      return;
    }
    if (user.role !== 'jobseeker') {
      toast.error('Only job seeker accounts can apply for jobs.');
      return;
    }
    if (!job.is_active) {
      toast.error('This job is no longer accepting applications.');
      return;
    }

    setApplying(true);
    try {
      const token = window.localStorage.getItem('token') || Cookies.get('token');
      const { data } = await axios.post(`${user_service}/api/user/apply/job`, { job_id: job.job_id }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      toast.success(data?.message || 'Application submitted successfully');
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message || 'Unable to submit your application' : 'Unable to submit your application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-10 text-center shadow-xl">
          <h1 className="text-3xl font-semibold">Job not found</h1>
          <p className="mt-3 text-sm text-slate-600">The requested job could not be loaded. Try another listing.</p>
          <Link href="/jobs">
            <Button className="mt-6">Back to job listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft size={16} /> Back to listings
            </Link>
            <p className="text-sm uppercase tracking-[0.35em] text-sky-600">Job details</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">{job.title}</h1>
            <p className="mt-2 text-slate-600">{job.company_name || 'Hirevix Company'} • {job.role}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{job.job_type}</span>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{job.work_location}</span>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-2xl">
          <div className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-900">About the role</h2>
                <p className="text-slate-600 leading-7">{job.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Location</p>
                  <div className="mt-2 flex items-center gap-2 text-slate-700">
                    <MapPin size={16} />
                    <span>{job.location}</span>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Salary</p>
                  <div className="mt-2 flex items-center gap-2 text-slate-700">
                    <IndianRupee size={16} />
                    <span>{job.salary ? `₹${job.salary.toLocaleString()}` : 'Not disclosed'}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Openings</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{job.openings}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{job.is_active ? 'Open' : 'Closed'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-slate-900">Company snapshot</h3>
                <p className="text-sm text-slate-600">{job.company_name || 'Hirevix Company'} is hiring for core roles with strong salary and flexible work options.</p>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Apply action</p>
                <Button className="mt-4 w-full" onClick={applyForJob} disabled={applying || !job.is_active}>
                  {applying ? 'Submitting application...' : job.is_active ? 'Apply on Hirevix' : 'Applications closed'}
                </Button>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Recruiter support</p>
                <p className="mt-3 text-sm text-slate-600">Want help with your application? Update your profile and complete your resume for a better match.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
