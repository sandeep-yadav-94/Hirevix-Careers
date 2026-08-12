"use client";

import axios from "axios";
import Cookies from "js-cookie";
import Link from "next/link";
import { Bell, BriefcaseBusiness, CheckCheck, ChevronRight, FileText, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { user_service, useAppData } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

type ApplicationUpdate = {
  application_id: number;
  job_id: number;
  job_title: string;
  status: string;
  recruiter_note?: string;
  applied_at: string;
};

type NotificationItem = {
  id: string;
  applicationId: number;
  jobId: number;
  jobTitle: string;
  kind: "status" | "note";
  title: string;
  detail: string;
  createdAt: string;
  read: boolean;
};

const snapshotKey = (userId: number) => `hirevix_application_snapshot_${userId}`;
const notificationsKey = (userId: number) => `hirevix_notifications_${userId}`;

function getStored<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function formatTime(value: string) {
  const date = new Date(value);
  const now = Date.now();
  const difference = now - date.getTime();
  if (difference < 60_000) return "Just now";
  if (difference < 3_600_000) return `${Math.floor(difference / 60_000)}m ago`;
  if (difference < 86_400_000) return `${Math.floor(difference / 3_600_000)}h ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function uniqueNotifications(items: NotificationItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function JobseekerNotifications() {
  const { user, isAuth, loading } = useAppData();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [syncing, setSyncing] = useState(false);

  const isJobseeker = isAuth && user?.role === "jobseeker";
  const visibleItems = useMemo(() => uniqueNotifications(items), [items]);
  const unreadCount = useMemo(() => visibleItems.filter((item) => !item.read).length, [visibleItems]);

  useEffect(() => {
    if (!isJobseeker || !user) {
      return;
    }

    const sync = async () => {
      setSyncing(true);
      try {
        const token = window.localStorage.getItem("token") || Cookies.get("token");
        const { data } = await axios.get<ApplicationUpdate[]>(`${user_service}/api/user/application/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const applications = Array.isArray(data) ? data : [];
        const previous = getStored<Record<number, Pick<ApplicationUpdate, "status" | "recruiter_note">>>(snapshotKey(user.user_id), {});
        const current = Object.fromEntries(applications.map((application) => [application.application_id, {
          status: application.status,
          recruiter_note: application.recruiter_note || "",
        }]));

        const additions: NotificationItem[] = [];
        applications.forEach((application) => {
          const old = previous[application.application_id];
          const note = application.recruiter_note?.trim() || "";

          if (old && old.status !== application.status) {
            additions.push({
              id: `status-${application.application_id}-${application.status}-${Date.now()}`,
              applicationId: application.application_id,
              jobId: application.job_id,
              jobTitle: application.job_title,
              kind: "status",
              title: "Application status updated",
              detail: `${application.job_title}: ${old.status} → ${application.status}`,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }

          if (old && note && old.recruiter_note !== note) {
            additions.push({
              id: `note-${application.application_id}-${Date.now()}`,
              applicationId: application.application_id,
              jobId: application.job_id,
              jobTitle: application.job_title,
              kind: "note",
              title: "New message from recruiter",
              detail: note,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }

          // On first visit, surface existing recruiter messages and non-default decisions.
          if (!old && (note || application.status !== "Submitted")) {
            additions.push({
              id: `existing-${application.application_id}-${note ? "note" : application.status}-${application.applied_at}`,
              applicationId: application.application_id,
              jobId: application.job_id,
              jobTitle: application.job_title,
              kind: note ? "note" : "status",
              title: note ? "Message from recruiter" : "Application update",
              detail: note || `${application.job_title}: your application is ${application.status}.`,
              createdAt: application.applied_at || new Date().toISOString(),
              read: false,
            });
          }
        });

        window.localStorage.setItem(snapshotKey(user.user_id), JSON.stringify(current));
        setItems((oldItems) => {
          const storedItems = oldItems.length ? oldItems : getStored<NotificationItem[]>(notificationsKey(user.user_id), []);
          const next = uniqueNotifications(additions.length ? [...additions, ...storedItems] : storedItems).slice(0, 60);
          window.localStorage.setItem(notificationsKey(user.user_id), JSON.stringify(next));
          return next;
        });
      } catch {
        // Notification polling is non-blocking; the rest of the app remains available offline.
      } finally {
        setSyncing(false);
      }
    };

    void sync();
    const interval = window.setInterval(sync, 10_000);
    return () => window.clearInterval(interval);
  }, [isJobseeker, user]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = originalOverflow; };
  }, [open]);

  const markAllRead = () => {
    if (!user) return;
    setItems((oldItems) => {
      const next = oldItems.map((item) => ({ ...item, read: true }));
      window.localStorage.setItem(notificationsKey(user.user_id), JSON.stringify(next));
      return next;
    });
  };

  const openNotification = () => {
    setOpen(true);
  };

  if (loading || !isJobseeker) return null;

  return <>
    <button type="button" onClick={openNotification} className="relative grid h-10 w-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}>
      <Bell size={19} />
      {unreadCount > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-background">{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </button>

    {open && createPortal(<div className="fixed inset-0 z-[100]">
      <button type="button" className="absolute inset-0 cursor-default bg-slate-950/65 backdrop-blur-md" onClick={() => setOpen(false)} aria-label="Close notifications" />
      <aside role="dialog" aria-modal="true" aria-label="Notifications" className="absolute inset-y-0 right-0 flex w-[88vw] max-w-[32rem] flex-col border-l border-slate-200 bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.35)] sm:w-[min(50vw,32rem)]">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 sm:h-11 sm:w-11 sm:rounded-2xl"><Bell size={19} /></div>
              <div><h2 className="text-base font-semibold text-slate-950 sm:text-lg">Notifications</h2><p className="text-xs text-slate-500 sm:text-sm">Application updates</p></div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close notifications"><X size={19} /></Button>
        </header>

        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          <p className="text-xs font-medium text-slate-500">{syncing ? "Checking for updates…" : unreadCount ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}` : "You are all caught up"}</p>
          {items.some((item) => !item.read) && <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"><CheckCheck size={15} /> Mark all read</button>}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {visibleItems.length ? <div className="space-y-3">
            {visibleItems.map((item) => <Link key={item.id} href={`/account#application-${item.applicationId}`} onClick={() => setOpen(false)} className={`group block rounded-[18px] border p-3 transition sm:rounded-[20px] sm:p-4 ${item.read ? "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50" : "border-blue-100 bg-blue-50/70 hover:border-blue-200"}`}>
              <div className="flex gap-2.5 sm:gap-3.5">
                <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl ${item.kind === "note" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>{item.kind === "note" ? <FileText size={17} /> : <BriefcaseBusiness size={17} />}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-slate-900 sm:text-base">{item.title}</p>{!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600 sm:h-2.5 sm:w-2.5" />}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-600 sm:mt-1.5 sm:text-sm sm:leading-6">{item.detail}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 sm:mt-3"><span className="truncate text-xs font-medium text-slate-500 sm:text-sm">{item.jobTitle}</span><span className="shrink-0 text-[11px] text-slate-400 sm:text-xs">{formatTime(item.createdAt)}</span></div>
                </div>
                <ChevronRight size={16} className="mt-2 shrink-0 text-slate-300 transition group-hover:text-blue-600" />
              </div>
            </Link>)}
          </div> : <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Bell size={24} /></div><p className="mt-4 text-sm font-semibold text-slate-900">No notifications yet</p><p className="mt-1 text-sm leading-6 text-slate-500">Status changes and recruiter messages will appear here.</p></div>}
        </div>
      </aside>
    </div>, document.body)}
  </>;
}
