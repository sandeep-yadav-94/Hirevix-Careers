"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bell, Bookmark, BriefcaseBusiness, CalendarClock, ChartNoAxesCombined, CheckCircle2, ChevronRight, CircleUserRound, FileText, Heart, Loader2, Sparkles, UserRoundCheck, UsersRound } from "lucide-react";
import { useAppData, job_service, user_service } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import type { Application, Job } from "@/type";

type DashboardJob = Job & { company_name?: string };
type CompanyWithJobs = { company_id: number; name: string; jobs?: DashboardJob[] };
const savedJobsKey = "hirevix_saved_jobs";

const getToken = () => typeof window !== "undefined" ? window.localStorage.getItem("token") || Cookies.get("token") : undefined;
const statusClass = (status: string) => status === "Hired" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-blue-50 text-blue-700 border-blue-200";

function MetricCard({ label, value, detail, icon: Icon, tone = "blue" }: { label: string; value: string | number; detail: string; icon: typeof BriefcaseBusiness; tone?: "blue" | "violet" | "emerald" | "amber" }) {
  const tones = { blue: "bg-blue-50 text-blue-600", violet: "bg-violet-50 text-violet-600", emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600" };
  return <div className="rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{value}</p><p className="mt-2 text-xs font-medium text-slate-500">{detail}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-2xl sm:h-11 sm:w-11 ${tones[tone]}`}><Icon size={20} /></div></div></div>;
}

function LoadingDashboard() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-40 animate-pulse rounded-[24px] border border-slate-200 bg-slate-100" />)}</div>;
}

export default function Dashboard() {
  const { user, loading } = useAppData();
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recruiterJobs, setRecruiterJobs] = useState<DashboardJob[]>([]);
  const [recruiterApplications, setRecruiterApplications] = useState<Application[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    const headers = getToken() ? { Authorization: `Bearer ${getToken()}` } : undefined;
    try {
      if (user.role === "jobseeker") {
        const [jobsResponse, applicationsResponse] = await Promise.all([
          axios.get<DashboardJob[]>(`${job_service}/api/job/all`),
          axios.get<Application[]>(`${user_service}/api/user/application/all`, { headers }),
        ]);
        setJobs(Array.isArray(jobsResponse.data) ? jobsResponse.data : []);
        setApplications(Array.isArray(applicationsResponse.data) ? applicationsResponse.data : []);
      } else {
        const companiesResponse = await axios.get<CompanyWithJobs[]>(`${job_service}/api/job/company/all`, { headers });
        const companies = Array.isArray(companiesResponse.data) ? companiesResponse.data : [];
        const detailResponses = await Promise.all(companies.map((company) => axios.get<CompanyWithJobs>(`${job_service}/api/job/company/${company.company_id}`, { headers })));
        const roles = detailResponses.flatMap(({ data }) => (data.jobs || []).map((job) => ({ ...job, company_name: data.name })));
        const applicationResponses = await Promise.all(roles.map((job) => axios.get<Application[]>(`${job_service}/api/job/application/${job.job_id}`, { headers })));
        setRecruiterJobs(roles);
        setRecruiterApplications(applicationResponses.flatMap(({ data }) => Array.isArray(data) ? data : []));
      }
    } catch {
      // Each embedded dashboard section carries a useful empty state when data is unavailable.
      setJobs([]); setApplications([]); setRecruiterJobs([]); setRecruiterApplications([]);
    } finally { setDataLoading(false); }
  }, [user]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);
  if (loading || dataLoading) return <LoadingDashboard />;
  if (!user) return null;
  return user.role === "jobseeker" ? <JobSeekerDashboard jobs={jobs} applications={applications} /> : <RecruiterDashboard jobs={recruiterJobs} applications={recruiterApplications} />;
}

function JobSeekerDashboard({ jobs, applications }: { jobs: DashboardJob[]; applications: Application[] }) {
  const [savedIds, setSavedIds] = useState<number[]>([]);
  useEffect(() => { try { setSavedIds(JSON.parse(window.localStorage.getItem(savedJobsKey) || "[]")); } catch { setSavedIds([]); } }, []);
  const savedJobs = jobs.filter((job) => savedIds.includes(job.job_id));
  const appliedIds = new Set(applications.map((application) => application.job_id));
  const recommended = jobs.filter((job) => !appliedIds.has(job.job_id)).slice(0, 3);
  const completion = useAppData().user ? [useAppData().user?.bio, useAppData().user?.resume, useAppData().user?.profile_pic, (useAppData().user?.skills || []).length > 0].filter(Boolean).length * 25 : 0;
  const interviews = applications.filter((application) => application.status === "Interview");
  const notifications = applications.filter((application) => application.recruiter_note || ["Interview", "Shortlisted", "Hired"].includes(application.status)).slice(0, 3);
  return <section className="space-y-4 sm:space-y-5"><div className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.8)] sm:rounded-[28px] sm:p-6 sm:flex-row sm:items-end sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200"><Sparkles size={15} className="text-blue-300" /> Job seeker dashboard</div><h2 className="mt-3 text-xl font-semibold sm:text-2xl">Your career search, beautifully organized.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Track applications, discover fitting opportunities, and keep your profile ready for the next recruiter.</p></div><Link href="/jobs"><Button className="w-full gap-2 bg-white text-slate-950 hover:bg-slate-100 sm:w-auto">Explore jobs <ChevronRight size={16} /></Button></Link></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Applied jobs" value={applications.length} detail="Every submitted application" icon={BriefcaseBusiness} /><MetricCard label="Saved jobs" value={savedJobs.length} detail="Saved from job search" icon={Bookmark} tone="violet" /><MetricCard label="Profile completion" value={`${completion}%`} detail="Complete profile gets noticed" icon={CircleUserRound} tone="emerald" /><MetricCard label="Resume views" value="—" detail="Tracking is coming soon" icon={FileText} tone="amber" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]"><div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-950">Recommended jobs</p><p className="mt-1 text-sm text-slate-500">Fresh opportunities you have not applied to.</p></div><Link href="/jobs" className="text-sm font-semibold text-blue-600">View all</Link></div><div className="mt-5 space-y-3">{recommended.length ? recommended.map((job) => <Link key={job.job_id} href={`/job/${job.job_id}`} className="block rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/30"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{job.title}</p><p className="mt-1 text-sm text-slate-500">{job.company_name || "Hiring company"} · {job.location}</p></div><ChevronRight size={18} className="text-slate-400" /></div><div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600"><span className="rounded-full bg-slate-100 px-2.5 py-1">{job.job_type}</span><span className="rounded-full bg-slate-100 px-2.5 py-1">{job.work_location}</span></div></Link>) : <Empty text="New recommendations will appear as opportunities are posted." />}</div></div>
      <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><CalendarClock size={18} className="text-violet-600" /><p className="font-semibold text-slate-950">Upcoming interviews</p></div><div className="mt-5 space-y-3">{interviews.length ? interviews.map((application) => <div key={application.application_id} className="rounded-2xl bg-violet-50 p-4"><p className="font-semibold text-slate-900">{application.job_title}</p><p className="mt-1 text-sm text-slate-600">Interview stage</p><p className="mt-3 text-xs font-semibold text-violet-700">Check recruiter notes for next steps</p></div>) : <Empty text="No interviews scheduled yet. Keep your profile sharp and applications moving." />}</div></div></div>
    <div className="grid gap-5 xl:grid-cols-2"><div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><Heart size={18} className="text-rose-500" /><p className="font-semibold text-slate-950">Saved jobs</p></div><div className="mt-4 space-y-3">{savedJobs.length ? savedJobs.slice(0, 3).map((job) => <Link key={job.job_id} href={`/job/${job.job_id}`} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><p className="font-semibold text-slate-900">{job.title}</p><p className="text-sm text-slate-500">{job.company_name || "Hiring company"}</p></div><ChevronRight size={17} className="text-slate-400" /></Link>) : <Empty text="Save interesting roles from the job search to revisit them here." />}</div></div><NotificationPanel notifications={notifications} /></div>
  </section>;
}

function RecruiterDashboard({ jobs, applications }: { jobs: DashboardJob[]; applications: Application[] }) {
  const shortlisted = applications.filter((application) => application.status === "Shortlisted");
  const interviews = applications.filter((application) => application.status === "Interview");
  const analytics = ["Submitted", "In Review", "Shortlisted", "Interview", "Hired"].map((status) => ({ status: status.replace(" ", "\n"), count: applications.filter((application) => application.status === status).length }));
  const activity = [...applications].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()).slice(0, 4);
  const notifications = applications.filter((application) => application.status === "Submitted" || application.status === "Interview").slice(0, 3);
  return <section className="space-y-4 sm:space-y-5"><div className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#172554_100%)] p-4 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.8)] sm:rounded-[28px] sm:p-6 sm:flex-row sm:items-end sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200"><Sparkles size={15} className="text-blue-300" /> Recruiter dashboard</div><h2 className="mt-3 text-xl font-semibold sm:text-2xl">Your hiring pipeline, in one focused view.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Stay close to every open role, candidate, and decision without losing momentum.</p></div><Link href="#companies"><Button className="w-full gap-2 bg-white text-slate-950 hover:bg-slate-100 sm:w-auto">Manage roles <ChevronRight size={16} /></Button></Link></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total jobs" value={jobs.length} detail="Roles across your companies" icon={BriefcaseBusiness} /><MetricCard label="Active jobs" value={jobs.filter((job) => job.is_active).length} detail="Currently accepting candidates" icon={CheckCircle2} tone="emerald" /><MetricCard label="Total applicants" value={applications.length} detail="Across all job openings" icon={UsersRound} tone="violet" /><MetricCard label="Shortlisted" value={shortlisted.length} detail={`${interviews.length} in interview stage`} icon={UserRoundCheck} tone="amber" /></div>
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]"><div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><ChartNoAxesCombined size={18} className="text-blue-600" /><div><p className="font-semibold text-slate-950">Hiring analytics</p><p className="text-sm text-slate-500">Candidate progression by stage</p></div></div><div className="mt-5 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics}><XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} /><Tooltip cursor={{ fill: "#eff6ff" }} /><Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></div><div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="font-semibold text-slate-950">Recent activity</p><p className="mt-1 text-sm text-slate-500">Latest candidate movement across your roles.</p></div><BriefcaseBusiness size={19} className="text-blue-600" /></div><div className="mt-5 space-y-3">{activity.length ? activity.map((application) => <div key={application.application_id} className="flex gap-3 rounded-2xl bg-slate-50 p-4"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><UserRoundCheck size={16} /></div><div><p className="text-sm font-semibold text-slate-900">New application for {application.job_title}</p><p className="mt-1 text-sm text-slate-500">{application.applicant_name || application.applicant_email} · {new Date(application.applied_at).toLocaleDateString()}</p></div></div>) : <Empty text="Applications will appear here as candidates respond." />}</div></div></div>
    <NotificationPanel notifications={notifications} recruiter />
  </section>;
}

function NotificationPanel({ notifications, recruiter = false }: { notifications: Application[]; recruiter?: boolean }) {
  return <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><Bell size={18} className="text-amber-500" /><div><p className="font-semibold text-slate-950">Notifications</p><p className="text-sm text-slate-500">{recruiter ? "Candidates that need attention." : "Updates from your applications."}</p></div></div><div className="mt-5 space-y-3">{notifications.length ? notifications.map((application) => <div key={application.application_id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 p-4"><div><p className="font-semibold text-slate-900">{recruiter ? `${application.applicant_name || application.applicant_email} applied` : application.job_title}</p><p className="mt-1 text-sm text-slate-500">{recruiter ? "Review the candidate profile and resume." : application.recruiter_note || "Your application has a new status."}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(application.status)}`}>{application.status}</span></div>) : <Empty text="You are all caught up. New updates will appear here." />}</div></div>;
}

function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">{text}</div>; }
