"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { auth_service, useAppData } from '@/context/AppContext';
import Loading from '@/components/loading';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const { isAuth, setUser, loading, setIsAuth } = useAppData();
  const router = useRouter();

  useEffect(() => {
    if (isAuth) router.replace('/');
  }, [isAuth, router]);

  if (loading) return <Loading />;

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBtnLoading(true);
    try {
      const { data } = await axios.post(`${auth_service}/api/auth/login`, { email, password });
      const userPayload = data?.user ?? data?.userObject ?? data?.registerdUser ?? data?.registeredUser ?? null;
      const token = data?.token;
      if (!token) throw new Error('Login response did not include an authentication token.');
      Cookies.set('token', token, { expires: 15, secure: window.location.protocol === 'https:', sameSite: 'lax', path: '/' });
      window.localStorage.setItem('token', token);
      if (userPayload) window.localStorage.setItem('auth_user', JSON.stringify(userPayload));
      setUser(userPayload);
      setIsAuth(true);
      toast.success(data?.message || 'Signed in successfully');
      router.push('/');
    } catch (error: unknown) {
      toast.error(axios.isAxiosError(error) ? (error.response?.data?.message || error.message) : 'Login failed. Please try again.');
      setUser(null);
      setIsAuth(false);
    } finally {
      setBtnLoading(false);
    }
  };

  return <main className="relative min-h-screen overflow-hidden bg-[#07080d] px-4 py-5 text-white sm:px-6 sm:py-8">
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -left-24 top-[-10rem] h-80 w-80 rounded-full bg-[#f2b33d]/15 blur-[120px]" /><div className="absolute -right-24 bottom-[-10rem] h-96 w-96 rounded-full bg-[#2fd8c4]/12 blur-[130px]" /><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" /></div>
    <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center justify-center">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/65 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-[.93fr_1.07fr]">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#151c2a] via-[#111722] to-[#0d211f] p-10 lg:flex lg:flex-col">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[26px] border-[#f2b33d]/10" /><div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-[28px] border-[#2fd8c4]/10" />
          <div className="relative flex items-center gap-3 text-lg font-bold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f2b33d]/15 text-[#f2b33d]"><BriefcaseBusiness size={21} /></span>Hirevix</div>
          <div className="relative my-auto"><span className="inline-flex items-center gap-2 rounded-full border border-[#2fd8c4]/20 bg-[#2fd8c4]/10 px-3 py-1.5 text-xs font-semibold text-[#2fd8c4]"><Sparkles size={14} /> Your career, in motion</span><h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight">A smarter way to<br />build your future.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-white/50">Discover opportunities, connect with exceptional talent, and move your career forward with confidence.</p></div>
          <div className="relative flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-white/50"><ShieldCheck size={19} className="text-[#2fd8c4]" /> Secure, trusted access to Hirevix</div>
        </aside>
        <div className="px-5 py-8 sm:px-10 sm:py-11 lg:px-14 lg:py-12">
          <div className="flex items-center justify-between lg:hidden"><Link href="/" className="flex items-center gap-2 text-lg font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f2b33d]/15 text-[#f2b33d]"><BriefcaseBusiness size={19} /></span>Hirevix</Link><span className="text-xs text-white/35">Welcome back</span></div>
          <div className="mt-10 lg:mt-4"><p className="text-sm font-semibold text-[#2fd8c4]">Welcome back</p><h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Sign in to Hirevix</h2><p className="mt-3 text-sm leading-6 text-white/45">Enter your details to continue where you left off.</p></div>
          <form onSubmit={submitHandler} className="mt-8 space-y-5" noValidate>
            <label className="block"><span className="mb-2 block text-sm font-medium text-white/75">Email address</span><span className="relative block"><Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required autoComplete="email" className="h-[52px] w-full rounded-xl border border-white/10 bg-white/[.045] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#2fd8c4] focus:bg-[#2fd8c4]/[.06] focus:ring-4 focus:ring-[#2fd8c4]/10" /></span></label>
            <label className="block"><span className="mb-2 flex items-center justify-between text-sm font-medium text-white/75">Password <Link href="/forgot" className="font-semibold text-[#2fd8c4] transition hover:text-[#65ecdc]">Forgot password?</Link></span><span className="relative block"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required autoComplete="current-password" className="h-[52px] w-full rounded-xl border border-white/10 bg-white/[.045] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#2fd8c4] focus:bg-[#2fd8c4]/[.06] focus:ring-4 focus:ring-[#2fd8c4]/10" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            <button type="submit" disabled={btnLoading} className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2b33d] to-[#2fd8c4] px-5 text-sm font-bold text-slate-950 shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(242,179,61,.55)] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">{btnLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" /> : <>Sign in <ArrowRight size={18} /></>}</button>
          </form>
          <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-white/45">New to Hirevix? <Link href="/register" className="font-semibold text-[#f2b33d] transition hover:text-[#ffd273]">Create your account</Link></div>
        </div>
      </motion.section>
    </div>
  </main>;
};

export default LoginPage;
