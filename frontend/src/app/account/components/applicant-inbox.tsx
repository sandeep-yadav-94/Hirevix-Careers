"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useAppData, job_service } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BriefcaseBusiness, CheckCircle2, ClipboardList, Clock3, FileText, Loader2, Mail, Phone, Search, Sparkles, UserRound } from "lucide-react";

interface JobSummary {
  job_id: number;
  title: string;
  role: string;
  location: string;
  salary: number | string;
  company_name?: string;
  is_active?: boolean;
}

interface ApplicantRecord {
  application_id: number;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  applicant_profile_pic?: string;
  resume: string;
  status: string;
  recruiter_note?: string;
  subscribed?: boolean;
  applied_at: string;
}

export default function ApplicantInbox() {
  const { user, loading } = useAppData();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null);
  const [applicants, setApplicants] = useState<ApplicantRecord[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<number, { status: string; recruiter_note: string; saving: boolean }>>({});

  const getToken = () => (typeof window !== "undefined" && window.localStorage.getItem("token")) || Cookies.get("token");

  const fetchJobs = async () => {
    if (!user || user.role !== "recruiter") return;
    setLoadingJobs(true);
    try {
      const token = getToken();
      const { data } = await axios.get(`${job_service}/api/job/company/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const companies = Array.isArray(data) ? data : [];
      const jobResponses = await Promise.all(
        companies.map((company: any) =>
          axios.get(`${job_service}/api/job/company/${company.company_id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          })
        )
      );
      const allJobs = jobResponses.flatMap((response) => {
        const company = response.data;
        const companyJobs = Array.isArray(company?.jobs) ? company.jobs : [];
        return companyJobs.map((job: any) => ({
          ...job,
          company_name: company?.name || "",
        }));
      });
      setJobs(allJobs);
      if (allJobs.length > 0 && !selectedJob) {
        setSelectedJob(allJobs[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load recruiter opportunities");
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadApplicants = async (job: JobSummary | null) => {
    if (!job) return;
    setLoadingApplicants(true);
    try {
      const token = getToken();
      const { data } = await axios.get(`${job_service}/api/job/application/${job.job_id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const applicantsData = Array.isArray(data) ? data : [];
      setApplicants(applicantsData);
      const nextDrafts: Record<number, { status: string; recruiter_note: string; saving: boolean }> = {};
      applicantsData.forEach((app: ApplicantRecord) => {
        nextDrafts[app.application_id] = {
          status: app.status || "Submitted",
          recruiter_note: app.recruiter_note || "",
          saving: false,
        };
      });
      setDrafts(nextDrafts);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load applicants for this role");
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  useEffect(() => {
    if (selectedJob) {
      loadApplicants(selectedJob);
    }
  }, [selectedJob]);

  const filteredApplicants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applicants;
    return applicants.filter((app) => {
      const haystack = [app.applicant_name, app.applicant_email, app.status, app.recruiter_note].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [applicants, search]);

  const saveApplicantUpdate = async (applicationId: number) => {
    const draft = drafts[applicationId];
    if (!draft || !selectedJob) return;
    setDrafts((prev) => ({ ...prev, [applicationId]: { ...prev[applicationId], saving: true } }));
    try {
      const token = getToken();
      const { data } = await axios.put(
        `${job_service}/api/job/application/update/${applicationId}`,
        { status: draft.status, recruiter_note: draft.recruiter_note },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      toast.success(data?.message || "Applicant updated");
      await loadApplicants(selectedJob);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save the applicant update");
    }
  };

  if (loading) return <div className="mx-auto max-w-7xl rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">Loading recruiter workspace…</div>;
  if (!user) return null;
  if (user.role !== "recruiter") {
    return (
      <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-900">This workspace is reserved for recruiters.</p>
        <p className="mt-2 text-sm text-slate-500">Switch to a recruiter account to review applicants.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_80px_-30px_rgba(2,6,23,0.2)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
              <Sparkles size={15} className="text-blue-600" />
              Recruiter applicant inbox
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Review applications and move candidates forward with clarity.</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">Track every applicant response, adjust status in seconds, and keep recruiter notes tied to the right opportunity.</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Active roles</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">{jobs.length}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BriefcaseBusiness size={16} className="text-blue-600" />
                Roles in review
              </div>
              {loadingJobs ? (
                <div className="mt-4 space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="h-16 animate-pulse rounded-[18px] bg-white" />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="mt-4 rounded-[20px] border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                  No roles are available for review yet.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {jobs.map((job) => {
                    const applicantCount = applicants.filter((app) => app.status).length;
                    const isActive = selectedJob?.job_id === job.job_id;
                    return (
                      <button
                        key={job.job_id}
                        type="button"
                        onClick={() => setSelectedJob(job)}
                        className={`w-full rounded-[20px] border p-4 text-left transition ${isActive ? "border-blue-300 bg-white shadow-sm" : "border-transparent bg-white/80 hover:border-slate-300"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{job.company_name || "Your company"}</p>
                          </div>
                          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            {job.is_active ? "Open" : "Paused"}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                          <ClipboardList size={14} />
                          <span>{applicantCount} applicants in current view</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedJob?.title || "Applicant pipeline"}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedJob?.company_name || "Select a role to review candidates"}</p>
              </div>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search applicant"
                  className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 sm:w-56"
                />
              </div>
            </div>

            {loadingApplicants ? (
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="animate-pulse rounded-[22px] border border-slate-200 bg-white p-5">
                    <div className="h-4 w-24 rounded bg-slate-200" />
                    <div className="mt-3 h-3 w-40 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="mt-6 rounded-[22px] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No applicants yet for this role. Once candidates apply, their profile and notes will appear here.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {filteredApplicants.map((app) => {
                  const currentDraft = drafts[app.application_id] || { status: app.status || "Submitted", recruiter_note: app.recruiter_note || "", saving: false };
                  return (
                    <div key={app.application_id} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                            {app.applicant_profile_pic ? (
                              <img src={app.applicant_profile_pic} alt={app.applicant_name} className="h-full w-full rounded-2xl object-cover" />
                            ) : (
                              <UserRound size={20} />
                            )}
                          </div>
                          <div>
                            <div className="text-base font-semibold text-slate-900">{app.applicant_name || app.applicant_email}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                              <span className="inline-flex items-center gap-1"><Mail size={14} />{app.applicant_email}</span>
                              {app.applicant_phone && <span className="inline-flex items-center gap-1"><Phone size={14} />{app.applicant_phone}</span>}
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                              <Clock3 size={14} />
                              Applied {new Date(app.applied_at).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Subscription</div>
                          <div className="mt-1 font-semibold text-slate-900">{app.subscribed ? "Premium" : "Free"}</div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</label>
                          <select
                            value={currentDraft.status}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [app.application_id]: { ...prev[app.application_id], status: e.target.value } }))}
                            className="w-full rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                          >
                            <option>Submitted</option>
                            <option>In Review</option>
                            <option>Shortlisted</option>
                            <option>Interview</option>
                            <option>Hired</option>
                            <option>Rejected</option>
                          </select>
                          <a href={app.resume} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                            <FileText size={15} />
                            Open resume
                          </a>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recruiter note</label>
                          <textarea
                            value={currentDraft.recruiter_note}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [app.application_id]: { ...prev[app.application_id], recruiter_note: e.target.value } }))}
                            className="min-h-24 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400"
                            placeholder="Add context, follow-up, or feedback"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        <Button variant="outline" onClick={async () => {
                          if (!app.applicant_phone) {
                            toast.error("No phone number is available for this applicant");
                            return;
                          }
                          await navigator.clipboard?.writeText(app.applicant_phone);
                          toast.success("Phone copied");
                        }}>Copy phone</Button>
                        <Button onClick={() => saveApplicantUpdate(app.application_id)} disabled={currentDraft.saving}>
                          {currentDraft.saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Save</>}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
