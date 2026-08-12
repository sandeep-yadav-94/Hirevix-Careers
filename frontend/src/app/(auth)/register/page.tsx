"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowRight, BriefcaseBusiness, Check, Eye, EyeOff, FileText, LockKeyhole, Mail, Phone, Sparkles, UserRound } from 'lucide-react';
import { auth_service, useAppData } from '@/context/AppContext';
import Loading from '@/components/loading';

const fieldClass = 'h-[52px] w-full rounded-xl border border-white/10 bg-white/[.045] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#2fd8c4] focus:bg-[#2fd8c4]/[.06] focus:ring-4 focus:ring-[#2fd8c4]/10';

const RegisterPage = () => {
  const [name, setName] = useState(''); const [role, setRole] = useState(''); const [phoneNumber, setPhoneNumber] = useState(''); const [bio, setBio] = useState(''); const [resume, setResume] = useState<File | null>(null); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [btnLoading, setBtnLoading] = useState(false);
  const { isAuth, setUser, loading, setIsAuth } = useAppData(); const router = useRouter();
  useEffect(() => { if (isAuth) router.replace('/'); }, [isAuth, router]);
  if (loading) return <Loading />;

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBtnLoading(true);
    const formData = new FormData(); formData.append('role', role); formData.append('name', name); formData.append('email', email); formData.append('password', password); formData.append('phoneNumber', phoneNumber);
    if (role === 'jobseeker') { formData.append('bio', bio); if (resume) formData.append('File', resume); }
    try {
      const { data } = await axios.post(`${auth_service}/api/auth/register`, formData);
      toast.success(data?.message || 'Registration successful');
      router.push('/login');
    } catch (error: unknown) {
      toast.error(axios.isAxiosError(error) ? (error.response?.data?.message || error.message) : 'Registration failed. Please try again.');
      setUser(null);
      setIsAuth(false);
    } finally {
      setBtnLoading(false);
    }
  };

  return <main className="relative min-h-screen overflow-hidden bg-[#07080d] px-4 py-5 text-white sm:px-6 sm:py-8">
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -left-24 top-[-10rem] h-80 w-80 rounded-full bg-[#f2b33d]/15 blur-[120px]" /><div className="absolute -right-24 bottom-[-10rem] h-96 w-96 rounded-full bg-[#2fd8c4]/12 blur-[130px]" /><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" /></div>
    <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center justify-center">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/65 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-[.84fr_1.16fr]">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#151c2a] via-[#111722] to-[#0d211f] p-10 lg:flex lg:flex-col"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[26px] border-[#f2b33d]/10" /><div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-[28px] border-[#2fd8c4]/10" /><div className="relative flex items-center gap-3 text-lg font-bold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f2b33d]/15 text-[#f2b33d]"><BriefcaseBusiness size={21} /></span>Hirevix</div><div className="relative my-auto"><span className="inline-flex items-center gap-2 rounded-full border border-[#f2b33d]/20 bg-[#f2b33d]/10 px-3 py-1.5 text-xs font-semibold text-[#f2b33d]"><Sparkles size={14} /> Built for ambitious people</span><h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight">Your next move<br />starts here.</h1><p className="mt-5 max-w-xs text-sm leading-6 text-white/50">Whether you&apos;re hiring or growing your career, Hirevix brings every opportunity into focus.</p></div><div className="relative space-y-3 border-t border-white/10 pt-6 text-sm text-white/55"><p className="flex items-center gap-2"><Check size={16} className="text-[#2fd8c4]" /> Personalized job discovery</p><p className="flex items-center gap-2"><Check size={16} className="text-[#2fd8c4]" /> Meaningful talent connections</p></div></aside>
        <div className="px-5 py-8 sm:px-10 sm:py-11 lg:px-12 lg:py-10"><div className="flex items-center justify-between lg:hidden"><Link href="/" className="flex items-center gap-2 text-lg font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f2b33d]/15 text-[#f2b33d]"><BriefcaseBusiness size={19} /></span>Hirevix</Link><span className="text-xs text-white/35">Create account</span></div><div className="mt-9 lg:mt-0"><p className="text-sm font-semibold text-[#f2b33d]">Get started</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Create your account</h1><p className="mt-3 text-sm leading-6 text-white/45">Choose how you&apos;ll use Hirevix, then tell us a little about yourself.</p></div>
          <form onSubmit={submitHandler} className="mt-7" noValidate>
            <div><p className="mb-3 text-sm font-medium text-white/75">I&apos;m here to</p><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setRole('jobseeker')} className={`rounded-xl border p-3 text-left transition ${role === 'jobseeker' ? 'border-[#2fd8c4] bg-[#2fd8c4]/10 shadow-[0_0_0_3px_rgba(47,216,196,.1)]' : 'border-white/10 bg-white/[.03] hover:border-white/25'}`}><BriefcaseBusiness size={19} className={role === 'jobseeker' ? 'text-[#2fd8c4]' : 'text-white/45'} /><span className="mt-2 block text-sm font-semibold">Find a job</span><span className="mt-1 block text-xs text-white/40">For job seekers</span></button><button type="button" onClick={() => setRole('recruiter')} className={`rounded-xl border p-3 text-left transition ${role === 'recruiter' ? 'border-[#f2b33d] bg-[#f2b33d]/10 shadow-[0_0_0_3px_rgba(242,179,61,.1)]' : 'border-white/10 bg-white/[.03] hover:border-white/25'}`}><UserRound size={19} className={role === 'recruiter' ? 'text-[#f2b33d]' : 'text-white/45'} /><span className="mt-2 block text-sm font-semibold">Hire talent</span><span className="mt-1 block text-xs text-white/40">For recruiters</span></button></div></div>
            {role && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-white/75">Full name</span><span className="relative block"><UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" required className={fieldClass} /></span></label><label className="block"><span className="mb-2 block text-sm font-medium text-white/75">Email address</span><span className="relative block"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required autoComplete="email" className={fieldClass} /></span></label><label className="block"><span className="mb-2 block text-sm font-medium text-white/75">Phone number</span><span className="relative block"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} /><input type="number" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+91 123456789" required className={fieldClass} /></span></label><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-white/75">Password</span><span className="relative block"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a secure password" required autoComplete="new-password" className={`${fieldClass} pr-12`} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
              {role === 'jobseeker' && <><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-white/75">Resume <span className="text-white/35">(PDF)</span></span><span className="relative flex h-[52px] items-center rounded-xl border border-dashed border-white/15 bg-white/[.035] px-4 transition hover:border-[#2fd8c4]/60"><FileText size={18} className="mr-3 text-[#2fd8c4]" /><span className="truncate text-sm text-white/50">{resume ? resume.name : 'Choose your resume PDF'}</span><input type="file" accept="application/pdf" onChange={(event: ChangeEvent<HTMLInputElement>) => setResume(event.target.files?.[0] || null)} required className="absolute inset-0 cursor-pointer opacity-0" /></span></label><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-white/75">Short bio</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Tell us a little about yourself" required rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#2fd8c4] focus:bg-[#2fd8c4]/[.06] focus:ring-4 focus:ring-[#2fd8c4]/10" /></label></>}
              <button type="submit" disabled={btnLoading} className="sm:col-span-2 mt-1 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2b33d] to-[#2fd8c4] px-5 text-sm font-bold text-slate-950 shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(242,179,61,.55)] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">{btnLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" /> : <>Create account <ArrowRight size={18} /></>}</button></motion.div>}
          </form><div className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-white/45">Already have an account? <Link href="/login" className="font-semibold text-[#2fd8c4] transition hover:text-[#65ecdc]">Sign in</Link></div>
        </div>
      </motion.section>
    </div>
  </main>;
};

export default RegisterPage;
