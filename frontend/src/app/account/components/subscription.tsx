"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { CheckCircle2, Crown, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { payment_service, useAppData } from "@/context/AppContext";
import type { User } from "@/type";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void };
  }
}

const loadCheckout = () => new Promise<boolean>((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export default function Subscription({ user }: { user: User }) {
  const { setUser } = useAppData();
  const [paying, setPaying] = useState(false);
  const subscriptionEnd = user.subscription ? new Date(user.subscription) : null;
  const active = !!subscriptionEnd && subscriptionEnd.getTime() > Date.now();
  const authHeaders = () => {
    const token = window.localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const startCheckout = async () => {
    setPaying(true);
    try {
      const ready = await loadCheckout();
      if (!ready) throw new Error("Unable to load Razorpay checkout. Please check your internet connection and try again.");
      const { data: order } = await axios.post(`${payment_service}/api/payment/order`, {}, { headers: authHeaders() });
      const Razorpay = window.Razorpay;
      if (!Razorpay) throw new Error("Razorpay checkout is unavailable");
      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Hirevix",
        description: "Priority applicant plan · 30 days",
        order_id: order.orderId,
        prefill: { name: user.name, email: user.email, contact: user.phone_number },
        notes: { plan: order.planName },
        theme: { color: "#2563eb" },
        modal: { confirm_close: true, ondismiss: () => setPaying(false) },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const { data } = await axios.post(`${payment_service}/api/payment/verify`, response, { headers: authHeaders() });
            setUser((current) => current ? { ...current, subscription: data.subscriptionExpiresAt } : current);
            toast.success(data.message || "Your 30-day plan is active");
          } catch (error) {
            toast.error(axios.isAxiosError(error) ? error.response?.data?.message || "Payment was received but could not be verified. Please contact support." : "Unable to verify payment");
          } finally { setPaying(false); }
        },
      });
      checkout.on("payment.failed", (response) => { toast.error(response.error?.description || "Payment was not completed"); setPaying(false); });
      checkout.open();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message || "Unable to start checkout" : error instanceof Error ? error.message : "Unable to start checkout");
      setPaying(false);
    }
  };

  return <div className={`mt-5 overflow-hidden rounded-[24px] border p-5 ${active ? "border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#ffffff_100%)]" : "border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_100%)]"}`}>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${active ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}><Crown size={21} /></div><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-900">{active ? "Hirevix Priority is active" : "No active subscription plan"}</p>{active && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700"><CheckCircle2 size={11} /> Active</span>}</div><p className="mt-1 text-sm leading-6 text-slate-600">{active ? <>Priority placement in recruiter applicant lists until <strong>{subscriptionEnd.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>.</> : "Get priority placement at the top of recruiter applicant lists for 30 days."}</p></div></div>
      {active ? <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white/80 px-3 py-2 text-xs font-semibold text-amber-800"><ShieldCheck size={15} /> Priority applicant</div> : <Button onClick={startCheckout} disabled={paying} className="h-11 shrink-0 gap-2 bg-amber-500 text-slate-950 hover:bg-amber-400">{paying ? <><Loader2 size={16} className="animate-spin" /> Opening checkout…</> : <><Crown size={16} /> Subscribe now · ₹10</>}</Button>}
    </div>
    {!active && <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-4 text-xs font-medium text-slate-600"><span className="inline-flex items-center gap-1.5"><Sparkles size={14} className="text-amber-500" /> 30-day access</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600" /> ₹10 one-time payment</span><span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-blue-600" /> Secure Razorpay checkout</span></div>}
  </div>;
}
