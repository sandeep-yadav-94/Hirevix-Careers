'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useAppData, user_service } from '@/context/AppContext';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface Job {
  job_id: number;
  title: string;
  description: string;
  salary: string;
  location: string;
  job_type: string;
  role: string;
  work_location: string;
  created_at: string;
  company_name: string;
  company_logo: string;
  company_id: number;
}

export type JobType = 'Full-time' | 'Internship' | 'Part-time' | 'Contract';
export type WorkLocationType = 'Remote' | 'On-site' | 'Hybrid';

interface FilterState {
  jobTypes: JobType[];
  workLocations: WorkLocationType[];
}

// ==========================================
// CONSTANTS
// ==========================================

const JOB_SERVICE_URL = process.env.NEXT_PUBLIC_JOB_SERVICE_URL || 'http://localhost:4003';

const JOB_TYPES: JobType[] = ['Full-time', 'Internship', 'Part-time', 'Contract'];
const WORK_LOCATIONS: WorkLocationType[] = ['Remote', 'On-site', 'Hybrid'];

// ==========================================
// HELPER COMPONENTS (INLINE SVGs)
// ==========================================

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5m-5 0V11m0 5h5m-5-5h5m0 0V5" />
  </svg>
);

const CurrencyIcon = () => (
  <svg className="w-4 h-4 mr-1.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function JobsPage() {
  // Raw state from API
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search input state (immediate UI)
  const [titleInput, setTitleInput] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');

  // Debounced API params
  const [debouncedTitle, setDebouncedTitle] = useState<string>('');
  const [debouncedLocation, setDebouncedLocation] = useState<string>('');

  // Frontend filter state
  const [filters, setFilters] = useState<FilterState>({
    jobTypes: [],
    workLocations: [],
  });

  // Mobile filter UI drawer toggle
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Modal / Detailed View State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applying, setApplying] = useState<number | null>(null);
  const { user } = useAppData();
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);

  // Read saved preference from cookie on load (Demonstration of js-cookie usage)
  useEffect(() => {
    const savedLocation = Cookies.get('preferred_location');
    if (savedLocation) {
      setLocationInput(savedLocation);
      setDebouncedLocation(savedLocation);
    }
    try {
      const saved = JSON.parse(window.localStorage.getItem('hirevix_saved_jobs') || '[]');
      if (Array.isArray(saved)) setSavedJobIds(saved.filter((id): id is number => typeof id === 'number'));
    } catch {
      window.localStorage.removeItem('hirevix_saved_jobs');
    }
  }, []);

  // ------------------------------------------
  // DEBOUNCE LOGIC (500ms)
  // ------------------------------------------
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTitle(titleInput);
      setDebouncedLocation(locationInput);
      if (locationInput) {
        Cookies.set('preferred_location', locationInput, { expires: 7 });
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [titleInput, locationInput]);

  // ------------------------------------------
  // API FETCH FUNCTION
  // ------------------------------------------
  const fetchJobs = useCallback(async (titleParam: string, locationParam: string) => {
    setLoading(true);
    try {
      const response = await axios.get<Job[]>(`${JOB_SERVICE_URL}/api/job/all`, {
        params: {
          title: titleParam || undefined,
          location: locationParam || undefined,
        },
      });

      if (Array.isArray(response.data)) {
        setJobs(response.data);
      } else {
        setJobs([]);
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch jobs. Please try again.';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      toast.error(errorMessage);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when debounced parameters change
  useEffect(() => {
    fetchJobs(debouncedTitle, debouncedLocation);
  }, [debouncedTitle, debouncedLocation, fetchJobs]);

  // Direct manual trigger for search button
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedTitle(titleInput);
    setDebouncedLocation(locationInput);
    fetchJobs(titleInput, locationInput);
  };

  // ------------------------------------------
  // FRONTEND FILTERING LOGIC
  // ------------------------------------------
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Filter by Job Type (Full-time, Internship, etc.)
      if (filters.jobTypes.length > 0) {
        const matchesJobType = filters.jobTypes.some(
          (type) => job.job_type?.toLowerCase() === type.toLowerCase()
        );
        if (!matchesJobType) return false;
      }

      // Filter by Work Location (Remote, On-site, Hybrid)
      if (filters.workLocations.length > 0) {
        const matchesWorkLoc = filters.workLocations.some(
          (loc) => job.work_location?.toLowerCase() === loc.toLowerCase()
        );
        if (!matchesWorkLoc) return false;
      }

      return true;
    });
  }, [jobs, filters]);

  // Filter handlers
  const handleJobTypeChange = (type: JobType) => {
    setFilters((prev) => {
      const exists = prev.jobTypes.includes(type);
      return {
        ...prev,
        jobTypes: exists ? prev.jobTypes.filter((t) => t !== type) : [...prev.jobTypes, type],
      };
    });
  };

  const handleWorkLocationChange = (loc: WorkLocationType) => {
    setFilters((prev) => {
      const exists = prev.workLocations.includes(loc);
      return {
        ...prev,
        workLocations: exists ? prev.workLocations.filter((l) => l !== loc) : [...prev.workLocations, loc],
      };
    });
  };

  const clearAllFilters = () => {
    setTitleInput('');
    setLocationInput('');
    setDebouncedTitle('');
    setDebouncedLocation('');
    setFilters({ jobTypes: [], workLocations: [] });
    Cookies.remove('preferred_location');
    toast.success('All filters cleared');
  };

  // Date Formatter helper
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Recently posted';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently posted';
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleApplyClick = async (job: Job) => {
    // require authentication
    if (!user) {
      toast.error('Please sign in as a jobseeker to apply');
      return;
    }
    if (user.role !== 'jobseeker') {
      toast.error('Only jobseeker accounts can apply.');
      return;
    }

    try {
      setApplying(job.job_id);
      const token = window.localStorage.getItem('token') || Cookies.get('token');
      const { data } = await axios.post(
        `${user_service}/api/user/apply/job`,
        { job_id: job.job_id },
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        }
      );

      toast.success(data?.message || 'Applied successfully');
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || err.message;
        toast.error(message);
      } else {
        toast.error('Failed to apply. Please try again.');
      }
    } finally {
      setApplying(null);
      // After applying successfully, mark as applied locally
      setAppliedJobIds((prev) => (prev.includes(job.job_id) ? prev : [...prev, job.job_id]));
    }
  };

  const toggleSavedJob = (job: Job) => {
    if (!user) {
      toast.error('Please sign in to save jobs.');
      return;
    }
    const next = savedJobIds.includes(job.job_id)
      ? savedJobIds.filter((id) => id !== job.job_id)
      : [...savedJobIds, job.job_id];
    setSavedJobIds(next);
    window.localStorage.setItem('hirevix_saved_jobs', JSON.stringify(next));
    toast.success(next.includes(job.job_id) ? 'Job saved to your dashboard' : 'Job removed from saved jobs');
  };

  const fetchMyApplications = useCallback(async () => {
    if (!user || user.role !== 'jobseeker') return;
    try {
      const token = window.localStorage.getItem('token') || Cookies.get('token');
      const { data } = await axios.get(`${user_service}/api/user/application/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (Array.isArray(data)) {
        const ids = data.map((a: any) => a.job_id).filter(Boolean) as number[];
        setAppliedJobIds(ids);
      }
    } catch (error) {
      // silently ignore
    }
  }, [user]);

  useEffect(() => {
    fetchMyApplications();
  }, [user, fetchMyApplications]);

  // Helper for rendering image avatar fallbacks
  const renderCompanyLogo = (logoUrl: string, companyName: string) => {
    if (logoUrl && logoUrl.trim() !== '') {
      return (
        <img
          src={logoUrl}
          alt={`${companyName} logo`}
          className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0"
          onError={(e) => {
            // Replace with initial on error
            (e.target as HTMLElement).style.display = 'none';
            if ((e.target as HTMLElement).nextElementSibling) {
              ((e.target as HTMLElement).nextElementSibling as HTMLElement).style.display = 'flex';
            }
          }}
        />
      );
    }
    return (
      <div className="w-12 h-12 rounded-lg bg-blue-600 text-white font-bold text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
        {companyName ? companyName.charAt(0).toUpperCase() : 'C'}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toaster position="top-right" />

      {/* Top Header Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded-md flex items-center justify-center text-white font-extrabold text-xl tracking-wider">
              Hv
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight hidden sm:inline">
              Search Jobs
            </span>
          </div>
          <div className="text-sm font-medium text-slate-500">
            Find your next opportunity
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Header Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            {/* Title Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Job title, skill, or company"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition"
              />
            </div>

            {/* Location Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <LocationIcon />
              </div>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="City, state, or country"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition duration-150 ease-in-out flex items-center justify-center min-w-[120px]"
            >
              Search Jobs
            </button>
          </form>
        </section>

        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden mb-4 flex justify-between items-center">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm"
          >
            <FilterIcon />
            {showMobileFilters ? 'Hide Filters' : 'Filter Jobs'}
          </button>
          <span className="text-xs font-semibold text-slate-500">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Available
          </span>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar / Filters */}
          <aside
            className={`lg:col-span-1 ${
              showMobileFilters ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-20">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h2 className="font-bold text-slate-800 text-base">Filters</h2>
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  Clear all
                </button>
              </div>

              {/* Job Type Filter */}
              <div className="py-4 border-b border-gray-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Job Type
                </h3>
                <div className="space-y-2.5">
                  {JOB_TYPES.map((type) => (
                    <label key={type} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.jobTypes.includes(type)}
                        onChange={() => handleJobTypeChange(type)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 transition"
                      />
                      <span className="ml-2.5 text-sm text-slate-600 group-hover:text-slate-900 transition">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Work Location Filter */}
              <div className="py-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Work Location
                </h3>
                <div className="space-y-2.5">
                  {WORK_LOCATIONS.map((loc) => (
                    <label key={loc} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.workLocations.includes(loc)}
                        onChange={() => handleWorkLocationChange(loc)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 transition"
                      />
                      <span className="ml-2.5 text-sm text-slate-600 group-hover:text-slate-900 transition">
                        {loc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Job Listing View */}
          <section className="lg:col-span-3 space-y-4">
            {/* Header info bar */}
            <div className="hidden lg:flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 text-sm">
              <span className="font-semibold text-slate-700">
                Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'Job Result' : 'Job Results'}
              </span>
              {(debouncedTitle || debouncedLocation || filters.jobTypes.length > 0 || filters.workLocations.length > 0) && (
                <span className="text-xs text-slate-500">
                  Filtered search active
                </span>
              )}
            </div>

            {/* Loading Skeleton */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white p-5 rounded-xl border border-gray-200 animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mt-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredJobs.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BriefcaseIcon />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">No jobs found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  We couldn't find any opportunities matching your current filters. Try adjusting your search query or location.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Job Cards */}
            {!loading &&
              filteredJobs.length > 0 &&
              filteredJobs.map((job) => (
                <article
                  key={job.job_id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Logo, Title, Company */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3.5">
                        {renderCompanyLogo(job.company_logo, job.company_name)}
                        <div>
                          <h3 className="text-base font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer">
                            {job.title}
                          </h3>
                          <div className="flex items-center text-sm font-medium text-slate-600 mt-0.5">
                            <BuildingIcon />
                            <span>{job.company_name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Posted Date Badge */}
                      <div className="flex items-center text-xs text-slate-400 font-medium whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-full border border-gray-100">
                        <ClockIcon />
                        {formatDate(job.created_at)}
                      </div>
                    </div>

                    {/* Metadata Tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {job.role && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-slate-700">
                          <BriefcaseIcon />
                          {job.role}
                        </span>
                      )}
                      {job.work_location && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {job.work_location}
                        </span>
                      )}
                      {job.job_type && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {job.job_type}
                        </span>
                      )}
                      {job.location && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-slate-600 border border-gray-200">
                          {job.location}
                        </span>
                      )}
                    </div>

                    {/* Description snippet */}
                    <p className="text-sm text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {/* Card Footer: Salary & Actions */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center text-sm font-bold text-slate-800">
                      <CurrencyIcon />
                      <span>{job.salary || 'Salary Not Disclosed'}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 hover:bg-gray-50 text-slate-700 text-xs font-semibold rounded-lg transition"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => toggleSavedJob(job)}
                        className={`flex-1 sm:flex-none px-4 py-2 border text-xs font-semibold rounded-lg transition ${savedJobIds.includes(job.job_id) ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-300 text-slate-700 hover:bg-gray-50'}`}
                      >
                        {savedJobIds.includes(job.job_id) ? 'Saved' : 'Save'}
                      </button>
                      <button
                        onClick={() => handleApplyClick(job)}
                        disabled={applying === job.job_id || appliedJobIds.includes(job.job_id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-60"
                      >
                        {appliedJobIds.includes(job.job_id) ? 'Applied' : applying === job.job_id ? 'Applying...' : 'Apply Now'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </section>
        </div>
      </main>

      {/* View Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                {renderCompanyLogo(selectedJob.company_logo, selectedJob.company_name)}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedJob.title}</h2>
                  <p className="text-sm font-medium text-slate-600">{selectedJob.company_name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-3 border-y border-gray-100 text-sm text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-800 block">Location:</span>
                  {selectedJob.location || 'N/A'} ({selectedJob.work_location})
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block">Job Type:</span>
                  {selectedJob.job_type}
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block">Role:</span>
                  {selectedJob.role}
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block">Salary:</span>
                  {selectedJob.salary}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-800 block mb-1">Description:</span>
                <p className="whitespace-pre-line leading-relaxed">{selectedJob.description}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApplyClick(selectedJob);
                  setSelectedJob(null);
                }}
                disabled={appliedJobIds.includes(selectedJob.job_id)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {appliedJobIds.includes(selectedJob.job_id) ? 'Already Applied' : 'Apply Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
