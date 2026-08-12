"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Fingerprint,
  Mail,
  RefreshCw,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { auth_service, useAppData } from '@/context/AppContext';

const OTP_LENGTH = 6;
const EXPIRY_SECONDS = 600; // 10 minutes, cosmetic countdown only
const RING_RADIUS = 19;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function maskEmail(value: string) {
  if (!value || !value.includes('@')) return value || 'your email address';
  const [local, domain] = value.split('@');
  if (local.length <= 2) return `${local[0] ?? ''}${'•'.repeat(3)}@${domain}`;
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(3, local.length - 2))}@${domain}`;
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const { isAuth, setUser, setIsAuth } = useAppData();
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(EXPIRY_SECONDS);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const shakeControls = useAnimation();
  const otp = digits.join('');

  useEffect(() => {
    if (isAuth) router.replace('/');
  }, [isAuth, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const retryAfterParam = Number(params.get('retryAfter') || 0);
    setEmail(emailParam || '');
    setCooldownSeconds(retryAfterParam);
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => setCooldownSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (success) return;
    const timer = window.setInterval(() => setExpirySeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    shakeControls.start({ x: [0, -9, 8, -7, 6, -3, 0], transition: { duration: 0.45, ease: 'easeInOut' } });
  }, [error, shakeControls]);

  const updateDigits = (value: string, index: number) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!cleanValue) {
      setDigits((current) => current.map((digit, digitIndex) => digitIndex === index ? '' : digit));
      setError('');
      return;
    }
    const nextDigits = [...digits];
    cleanValue.split('').forEach((digit, offset) => {
      if (index + offset < OTP_LENGTH) nextDigits[index + offset] = digit;
    });
    setDigits(nextDigits);
    setError('');
    inputRefs.current[Math.min(index + cleanValue.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    setDigits(Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] || ''));
    setError('');
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  };

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      setError('Enter all 6 digits to continue.');
      inputRefs.current[digits.findIndex((digit) => !digit) || 0]?.focus();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${auth_service}/api/auth/verify-email`, { email, otp });
      if (!data?.token) throw new Error('Verification response did not include an authentication token.');
      Cookies.set('token', data.token, { expires: 15, secure: window.location.protocol === 'https:', sameSite: 'lax', path: '/' });
      window.localStorage.setItem('token', data.token);
      window.localStorage.setItem('auth_user', JSON.stringify(data.user));
      setSuccess(true);
      window.setTimeout(() => {
        setUser(data.user);
        setIsAuth(true);
        router.push('/');
      }, 1800);
    } catch (requestError) {
      const message = axios.isAxiosError(requestError) ? (requestError.response?.data?.message || requestError.message) : 'Verification failed. Please try again.';
      setError(message);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError('');
    try {
      const { data } = await axios.post(`${auth_service}/api/auth/resend-verification-otp`, { email });
      toast.success(data.message || 'A fresh code is on its way.');
      setDigits(Array(OTP_LENGTH).fill(''));
      setCooldownSeconds(60);
      setExpirySeconds(EXPIRY_SECONDS);
      inputRefs.current[0]?.focus();
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const seconds = Number(requestError.response?.data?.retryAfterSeconds || 0);
        if (seconds) setCooldownSeconds(seconds);
        setError(requestError.response?.data?.message || requestError.message);
      } else setError('Unable to resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const ringOffset = RING_CIRCUMFERENCE * (1 - expirySeconds / EXPIRY_SECONDS);
  const cooldownProgress = cooldownSeconds > 0 ? Math.min(1, cooldownSeconds / 60) : 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080D] text-white antialiased">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 top-[-9rem] h-[26rem] w-[26rem] rounded-full bg-[#F2B33D]/[.16] blur-[130px]"
        />
        <motion.div
          animate={{ x: [0, -22, 0], y: [0, 24, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-28 bottom-[-9rem] h-[28rem] w-[28rem] rounded-full bg-[#2FD8C4]/[.13] blur-[140px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_74%)]" />
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.section
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex min-h-screen w-full items-center justify-center px-5 py-10"
          >
            <div className="w-full max-w-sm rounded-[1.75rem] border border-[#F2B33D]/25 bg-[#0E1119]/80 px-7 py-11 text-center shadow-2xl shadow-black/60 backdrop-blur-xl sm:px-10">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                {/* Particle burst */}
                {Array.from({ length: 12 }).map((_, index) => {
                  const angle = (index / 12) * 360;
                  return (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0.4],
                        x: Math.cos((angle * Math.PI) / 180) * 58,
                        y: Math.sin((angle * Math.PI) / 180) * 58,
                      }}
                      transition={{ duration: 1.1, delay: 0.15, ease: 'easeOut' }}
                      className="absolute h-1.5 w-1.5 rounded-full bg-[#F2B33D]"
                    />
                  );
                })}
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-[0_0_0_8px_rgba(52,211,153,.12),0_0_60px_rgba(52,211,153,.4)] ring-2 ring-[#F2B33D]/60"
                >
                  <AnimatePresence mode="wait">
                    <motion.div key="check" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
                      <Check size={44} strokeWidth={3} />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>

              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-7 inline-flex items-center gap-1.5 rounded-full border border-[#F2B33D]/30 bg-[#F2B33D]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F2B33D]"
              >
                Access granted
              </motion.span>
              <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="mt-4 text-3xl font-bold tracking-tight">
                You&apos;re verified
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-3 text-sm leading-6 text-white/50">
                Your identity is confirmed and your Hirevix workspace is unlocking.
              </motion.p>
              <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.7, ease: 'easeInOut' }} className="h-full rounded-full bg-gradient-to-r from-[#F2B33D] to-emerald-400" />
              </div>
              <p className="mt-3 text-xs text-white/35">Taking you to Hirevix…</p>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="verify"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex min-h-screen w-full flex-col lg:items-center lg:justify-center lg:py-10"
          >
            {/* Mobile app bar */}
            <div className="flex items-center justify-between px-4 pb-3 pt-[max(1.1rem,env(safe-area-inset-top))] lg:hidden">
              <button
                onClick={() => router.push('/register')}
                aria-label="Back to registration"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[.04] text-white/70 transition active:scale-90"
              >
                <ChevronLeft size={18} />
              </button>
              <p className="text-sm font-semibold text-white/80">Verify email</p>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-4 rounded-full bg-[#F2B33D]" />
                <span className="h-1.5 w-4 rounded-full bg-[#2FD8C4]" />
              </div>
            </div>

            <div className="relative mx-auto flex w-full flex-1 flex-col overflow-hidden lg:max-w-5xl lg:flex-none lg:grid lg:grid-cols-[.85fr_1.15fr] lg:rounded-[2rem] lg:border lg:border-white/10 lg:bg-[#0E1119]/75 lg:shadow-2xl lg:shadow-black/60 lg:backdrop-blur-xl">

              {/* Desktop signature: access pass card */}
              <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#141826] via-[#12121b] to-[#0d1512] p-9 lg:flex lg:flex-col">
                <div className="flex items-center gap-2.5 text-[15px] font-bold tracking-tight">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F2B33D]/15 text-[#F2B33D]"><ShieldCheck size={19} /></span>
                  Hirevix
                </div>

                <div className="relative my-auto py-8">
                  <motion.div
                    animate={{ y: [0, -8, 0], rotate: [-1.2, 1.2, -1.2] }}
                    transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative w-full max-w-[19rem] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a2130] via-[#171b26] to-[#101a17] p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,.7)]"
                  >
                    <motion.div
                      aria-hidden
                      animate={{ x: ['-140%', '160%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
                      className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex h-8 w-11 items-center justify-center rounded-md bg-gradient-to-br from-[#F2B33D]/70 to-[#c98f1e]/70">
                        <div className="h-4 w-7 rounded-sm border border-black/20" />
                      </div>
                      <Fingerprint size={20} className="text-[#2FD8C4]" />
                    </div>
                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">Access pass</p>
                    <p className="mt-1 truncate text-sm font-semibold text-white/90">{maskEmail(email)}</p>
                    <div className="mt-4 flex items-end justify-between">
                      <div className="flex gap-[3px]">
                        {[3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 1].map((weight, index) => (
                          <span key={index} style={{ height: `${weight * 4 + 6}px` }} className="w-[2.5px] rounded-full bg-white/25" />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-[#F2B33D]/80">Pending</span>
                    </div>
                  </motion.div>
                </div>

                <div className="flex items-center gap-3 text-sm text-white/45">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white/70">1</span>
                  <span className="h-px flex-1 bg-white/15" />
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F2B33D] text-xs font-semibold text-slate-950">2</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-white/35">Confirm the code we sent to activate your account and issue your access pass.</p>
              </aside>

              {/* Perforated divider (desktop only) */}
              <div aria-hidden className="relative hidden lg:block">
                <div className="absolute left-0 top-0 h-full border-l border-dashed border-white/12" />
                <span className="absolute -left-[7px] -top-[7px] h-3.5 w-3.5 rounded-full bg-[#07080D]" />
                <span className="absolute -left-[7px] -bottom-[7px] h-3.5 w-3.5 rounded-full bg-[#07080D]" />
              </div>

              {/* Form panel */}
              <div className="relative flex-1 px-5 pb-8 pt-3 sm:px-8 lg:px-12 lg:py-12">
                <button
                  onClick={() => router.push('/register')}
                  className="hidden items-center gap-1 text-sm text-white/40 transition hover:text-white lg:inline-flex"
                >
                  <ChevronLeft size={17} /> Back to registration
                </button>

                <div className="mt-1 lg:mt-9">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2FD8C4]/25 bg-[#2FD8C4]/10 p-3 text-[#2FD8C4] shadow-lg shadow-black/30">
                    <Mail size={24} />
                  </div>
                  <p className="text-sm font-semibold tracking-wide text-[#2FD8C4]">Email verification</p>
                  <h1 className="mt-2 text-[1.75rem] font-bold tracking-tight sm:text-4xl">Check your inbox</h1>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/45">
                    Enter the six-digit code sent to <span className="font-medium text-white/80">{maskEmail(email)}</span>.
                  </p>
                </div>

                <form id="verify-otp-form" onSubmit={verify} className="mt-7">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white/70">Verification code</label>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.03] px-2.5 py-1 text-[11px] font-medium text-white/50">
                      <svg width="16" height="16" viewBox="0 0 40 40" className="-rotate-90">
                        <circle cx="20" cy="20" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3" />
                        <circle
                          cx="20"
                          cy="20"
                          r={RING_RADIUS}
                          fill="none"
                          stroke={expirySeconds <= 60 ? '#FB7185' : '#F2B33D'}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={RING_CIRCUMFERENCE}
                          strokeDashoffset={ringOffset}
                          style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                      </svg>
                      <Timer size={12} />
                      {formatClock(expirySeconds)}
                    </div>
                  </div>

                  <motion.div animate={shakeControls} className="mt-4 flex gap-2 sm:gap-3">
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => { inputRefs.current[index] = element; }}
                        value={digit}
                        onChange={(event) => updateDigits(event.target.value, index)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        onPaste={handlePaste}
                        inputMode="numeric"
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        maxLength={index === 0 ? OTP_LENGTH : 1}
                        aria-label={`Digit ${index + 1}`}
                        className={`h-12 min-w-0 flex-1 rounded-xl border bg-white/[.04] text-center font-mono text-xl font-bold tracking-wide outline-none transition-all duration-200 sm:h-14 sm:text-2xl ${
                          error
                            ? 'border-rose-400/70 bg-rose-400/[.06] text-rose-200'
                            : digit
                            ? 'border-[#F2B33D]/70 bg-[#F2B33D]/[.08] text-white shadow-[0_0_0_3px_rgba(242,179,61,.12)]'
                            : 'border-white/10 text-white'
                        } focus:border-[#2FD8C4] focus:bg-[#2FD8C4]/[.08] focus:shadow-[0_0_0_4px_rgba(47,216,196,.12)]`}
                      />
                    ))}
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-rose-300">
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== OTP_LENGTH}
                    className="mt-7 hidden h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F2B33D] to-[#2FD8C4] px-5 text-sm font-bold text-slate-950 shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(242,179,61,.5)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 lg:flex"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" /> Verifying secure code…
                      </>
                    ) : (
                      <>
                        Verify &amp; continue <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-7 border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/45">Didn&apos;t get the email?</p>
                    <button
                      type="button"
                      onClick={resend}
                      disabled={resending || !email || cooldownSeconds > 0}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2FD8C4] transition hover:text-[#5be7d7] disabled:cursor-not-allowed disabled:text-white/30"
                    >
                      <RefreshCw size={15} className={resending ? 'animate-spin' : ''} />
                      {resending ? 'Sending…' : cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend code'}
                    </button>
                  </div>
                  {cooldownSeconds > 0 && (
                    <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={false}
                        animate={{ width: `${cooldownProgress * 100}%` }}
                        transition={{ duration: 0.6, ease: 'linear' }}
                        className="h-full rounded-full bg-[#2FD8C4]/70"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky mobile CTA */}
            <div className="fixed inset-x-0 bottom-0 z-20 lg:hidden">
              <div className="bg-gradient-to-t from-[#07080D] via-[#07080D]/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
                <button
                  type="submit"
                  form="verify-otp-form"
                  disabled={loading || otp.length !== OTP_LENGTH}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F2B33D] to-[#2FD8C4] text-sm font-bold text-slate-950 shadow-lg shadow-black/40 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Verifying…
                    </>
                  ) : (
                    <>
                      Verify &amp; continue <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
