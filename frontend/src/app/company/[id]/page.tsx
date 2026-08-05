"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { useAppData, job_service } from "@/context/AppContext";
import { Company as CompanyType, Job } from "@/type";
import Loading from "@/components/loading";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Building2,
  Briefcase,
  Globe,
  Users,
  MapPin,
  IndianRupee,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

const CompanyPage = () => {
  const { user } = useAppData();
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [company, setCompany] = useState<CompanyType | null>(null);

  // Modals state for Company
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [isDeleteCompanyOpen, setIsDeleteCompanyOpen] = useState(false);

  // Modals state for Individual Job
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);
  const [isDeleteJobOpen, setIsDeleteJobOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Add Job Form State
  const [jobForm, setJobForm] = useState({
    title: "",
    role: "",
    description: "",
    salary: "",
    location: "",
    job_type: "Full-time",
    work_location: "Remote",
    openings: 1,
  });

  // Edit Job Form State
  const [editJobForm, setEditJobForm] = useState({
    title: "",
    role: "",
    description: "",
    salary: "",
    location: "",
    job_type: "Full-time",
    work_location: "Remote",
    openings: 1,
    is_active: true,
  });

  // Edit Company Form State
  const [companyForm, setCompanyForm] = useState({
    name: "",
    description: "",
    website: "",
    logo: null as File | null,
  });

  const getAuthToken = () => {
    return (
      (typeof window !== "undefined" && window.localStorage.getItem("token")) ||
      Cookies.get("token")
    );
  };

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      if (!token) return;

      const { data } = await axios.get(`${job_service}/api/job/company/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCompany(data);
      if (data) {
        setCompanyForm({
          name: data.name || "",
          description: data.description || "",
          website: data.website || "",
          logo: null,
        });
      }
    } catch (error) {
      console.error("Error fetching company details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCompany();
    }
  }, [id]);

  // Handle Create Job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBtnLoading(true);
      const token = getAuthToken();

      const payload = {
        ...jobForm,
        company_id: Number(id),
        salary: Number(jobForm.salary),
        openings: Number(jobForm.openings),
      };

      await axios.post(`${job_service}/api/job/new`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setIsAddJobOpen(false);
      setJobForm({
        title: "",
        role: "",
        description: "",
        salary: "",
        location: "",
        job_type: "Full-time",
        work_location: "Remote",
        openings: 1,
      });

      fetchCompany();
    } catch (error) {
      console.error("Failed to create job:", error);
    } finally {
      setBtnLoading(false);
    }
  };

  // Open Edit Job Modal
  const openEditJobModal = (job: Job) => {
    setSelectedJob(job);
    setEditJobForm({
      title: job.title || "",
      role: job.role || "",
      description: job.description || "",
      salary: job.salary ? job.salary.toString() : "",
      location: job.location || "",
      job_type: job.job_type || "Full-time",
      work_location: job.work_location || "Remote",
      openings: job.openings || 1,
      is_active: job.is_active ?? true,
    });
    setIsEditJobOpen(true);
  };

  // Handle Update Job
  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      setBtnLoading(true);
      const token = getAuthToken();

      const payload = {
        ...editJobForm,
        salary: Number(editJobForm.salary),
        openings: Number(editJobForm.openings),
      };

      await axios.put(`${job_service}/api/job/${selectedJob.job_id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setIsEditJobOpen(false);
      setSelectedJob(null);
      fetchCompany();
    } catch (error) {
      console.error("Failed to update job:", error);
    } finally {
      setBtnLoading(false);
    }
  };

  // Open Delete Job Modal
  const openDeleteJobModal = (job: Job) => {
    setSelectedJob(job);
    setIsDeleteJobOpen(true);
  };

  // Handle Delete Job
  const handleDeleteJob = async () => {
    if (!selectedJob) return;

    try {
      setBtnLoading(true);
      const token = getAuthToken();

      await axios.delete(`${job_service}/api/job/${selectedJob.job_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setIsDeleteJobOpen(false);
      setSelectedJob(null);
      fetchCompany();
    } catch (error) {
      console.error("Failed to delete job:", error);
    } finally {
      setBtnLoading(false);
    }
  };

  // Handle Edit Company
  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBtnLoading(true);
      const token = getAuthToken();

      const formData = new FormData();
      formData.append("name", companyForm.name);
      formData.append("description", companyForm.description);
      formData.append("website", companyForm.website);
      if (companyForm.logo) {
        formData.append("file", companyForm.logo);
      }

      await axios.put(`${job_service}/api/job/company/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setIsEditCompanyOpen(false);
      fetchCompany();
    } catch (error) {
      console.error("Failed to update company:", error);
    } finally {
      setBtnLoading(false);
    }
  };

  // Handle Delete Company
  const handleDeleteCompany = async () => {
    try {
      setBtnLoading(true);
      const token = getAuthToken();

      await axios.delete(`${job_service}/api/job/company/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setIsDeleteCompanyOpen(false);
      router.push("/companies");
    } catch (error) {
      console.error("Failed to delete company:", error);
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  const isRecruiterOwner =
    !!user && !!company && user.user_id === company.recruiter_id;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="overflow-hidden border shadow-xl">
          {/* Top Banner */}
          <div className="h-56 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute left-8 -bottom-16">
              <div className="h-32 w-32 rounded-2xl bg-white p-2 shadow-2xl">
                <img
                  src={company?.logo}
                  alt={company?.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              </div>
            </div>
          </div>

          <CardContent className="pt-28 md:pt-24 p-8">
            {/* Company Header */}
            <div className="flex flex-col md:flex-row md:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight">
                  {company?.name}
                </h1>
                <p className="text-muted-foreground max-w-3xl leading-relaxed">
                  {company?.description}
                </p>
                <a
                  href={company?.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Globe size={17} />
                  {company?.website}
                </a>
              </div>

              {isRecruiterOwner && (
                <div className="flex flex-wrap gap-3 items-start">
                  <Button onClick={() => setIsAddJobOpen(true)} className="gap-2">
                    <Plus size={18} />
                    Add Job
                  </Button>

                  <Button
                    onClick={() => setIsEditCompanyOpen(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Pencil size={16} />
                    Edit Company
                  </Button>

                  <Button
                    onClick={() => setIsDeleteCompanyOpen(true)}
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
              <div className="rounded-2xl border bg-background p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Briefcase className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                    <h2 className="text-3xl font-bold">
                      {company?.jobs?.length || 0}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-background p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex justify-center items-center">
                    <Users className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Openings</p>
                    <h2 className="text-3xl font-bold">
                      {company?.jobs?.reduce(
                        (total, job) => total + job.openings,
                        0
                      ) || 0}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-background p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-100 flex justify-center items-center">
                    <Building2 className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <h2 className="text-lg font-bold">
                      {new Date(company?.created_at || "").toLocaleDateString(
                        "en-US",
                        { month: "short", year: "numeric" }
                      )}
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="text-blue-600" />
                <h2 className="text-2xl font-bold">About Company</h2>
              </div>
              <div className="rounded-2xl border bg-background p-6 text-muted-foreground leading-relaxed">
                {company?.description}
              </div>
            </div>

            {/* Jobs Section */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Available Jobs</h2>
                <span className="rounded-full bg-blue-100 text-blue-700 px-4 py-1 text-sm font-medium">
                  {company?.jobs?.length || 0} Jobs
                </span>
              </div>

              {company?.jobs?.length ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {company.jobs.map((job) => (
                    <div
                      key={job.job_id}
                      className="rounded-2xl border bg-background p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold">{job.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {job.role}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {job.is_active ? (
                              <span className="h-fit rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                                Active
                              </span>
                            ) : (
                              <span className="h-fit rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium">
                                Closed
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 space-y-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <IndianRupee size={16} />
                            {job.salary
                              ? `₹${job.salary.toLocaleString()}`
                              : "Salary not disclosed"}
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin size={16} />
                            {job.location}
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase size={16} />
                            {job.job_type} • {job.work_location}
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users size={16} />
                            {job.openings} openings
                          </div>
                        </div>
                      </div>

                      {/* Job Footer Actions */}
                      <div className="mt-6 pt-4 border-t flex items-center gap-3">
                        <Button
                          onClick={() => router.push(`/job/${job.job_id}`)}
                          className="flex-1"
                        >
                          View Job
                        </Button>

                        {isRecruiterOwner && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openEditJobModal(job)}
                              variant="outline"
                              size="icon"
                              title="Edit Job"
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              onClick={() => openDeleteJobModal(job)}
                              variant="destructive"
                              size="icon"
                              title="Delete Job"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border bg-background py-16 text-center">
                  <Briefcase className="mx-auto h-14 w-14 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mt-4">
                    No jobs posted yet
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    This company has not created any job openings.
                  </p>

                  {isRecruiterOwner && (
                    <Button
                      onClick={() => setIsAddJobOpen(true)}
                      className="mt-6 gap-2"
                    >
                      <Plus size={18} />
                      Create First Job
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- ADD JOB MODAL --- */}
      <Dialog open={isAddJobOpen} onOpenChange={setIsAddJobOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post New Job</DialogTitle>
            <DialogDescription>
              Create a new job opportunity for {company?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateJob} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Backend Developer"
                  required
                  value={jobForm.title}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  placeholder="e.g. Full Stack Developer"
                  required
                  value={jobForm.role}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, role: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="Job responsibilities, requirements, etc..."
                rows={4}
                required
                value={jobForm.description}
                onChange={(e) =>
                  setJobForm({ ...jobForm, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Salary (₹)</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="e.g. 1000000"
                  required
                  value={jobForm.salary}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, salary: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Bareilly / Remote"
                  required
                  value={jobForm.location}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, location: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_type">Job Type</Label>
                <select
                  id="job_type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={jobForm.job_type}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, job_type: e.target.value })
                  }
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_location">Work Mode</Label>
                <select
                  id="work_location"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={jobForm.work_location}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, work_location: e.target.value })
                  }
                >
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openings">Openings</Label>
                <Input
                  id="openings"
                  type="number"
                  min="1"
                  required
                  value={jobForm.openings}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, openings: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddJobOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={btnLoading}>
                {btnLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Job
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- EDIT JOB MODAL --- */}
      <Dialog open={isEditJobOpen} onOpenChange={setIsEditJobOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Details</DialogTitle>
            <DialogDescription>
              Update job information for {selectedJob?.title}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateJob} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_title">Job Title</Label>
                <Input
                  id="edit_title"
                  required
                  value={editJobForm.title}
                  onChange={(e) =>
                    setEditJobForm({ ...editJobForm, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_role">Role</Label>
                <Input
                  id="edit_role"
                  required
                  value={editJobForm.role}
                  onChange={(e) =>
                    setEditJobForm({ ...editJobForm, role: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Job Description</Label>
              <Textarea
                id="edit_description"
                rows={4}
                required
                value={editJobForm.description}
                onChange={(e) =>
                  setEditJobForm({ ...editJobForm, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_salary">Salary (₹)</Label>
                <Input
                  id="edit_salary"
                  type="number"
                  required
                  value={editJobForm.salary}
                  onChange={(e) =>
                    setEditJobForm({ ...editJobForm, salary: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_location">Location</Label>
                <Input
                  id="edit_location"
                  required
                  value={editJobForm.location}
                  onChange={(e) =>
                    setEditJobForm({ ...editJobForm, location: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_job_type">Job Type</Label>
                <select
                  id="edit_job_type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editJobForm.job_type}
                  onChange={(e) =>
                    setEditJobForm({ ...editJobForm, job_type: e.target.value })
                  }
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_work_location">Work Mode</Label>
                <select
                  id="edit_work_location"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editJobForm.work_location}
                  onChange={(e) =>
                    setEditJobForm({
                      ...editJobForm,
                      work_location: e.target.value,
                    })
                  }
                >
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_openings">Openings</Label>
                <Input
                  id="edit_openings"
                  type="number"
                  min="1"
                  required
                  value={editJobForm.openings}
                  onChange={(e) =>
                    setEditJobForm({
                      ...editJobForm,
                      openings: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="edit_is_active"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={editJobForm.is_active}
                onChange={(e) =>
                  setEditJobForm({ ...editJobForm, is_active: e.target.checked })
                }
              />
              <Label htmlFor="edit_is_active" className="cursor-pointer">
                Job is active and accepting applications
              </Label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditJobOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={btnLoading}>
                {btnLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Job
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE JOB MODAL --- */}
      <Dialog open={isDeleteJobOpen} onOpenChange={setIsDeleteJobOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Job Listing?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{selectedJob?.title}</strong>?
              This action cannot be undone and will remove all applications for this job.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteJobOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteJob}
              disabled={btnLoading}
            >
              {btnLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- EDIT COMPANY MODAL --- */}
      <Dialog open={isEditCompanyOpen} onOpenChange={setIsEditCompanyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Company Details</DialogTitle>
            <DialogDescription>
              Update information for {company?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditCompany} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="comp_name">Company Name</Label>
              <Input
                id="comp_name"
                value={companyForm.name}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comp_website">Website URL</Label>
              <Input
                id="comp_website"
                type="url"
                value={companyForm.website}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, website: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comp_desc">Description</Label>
              <Textarea
                id="comp_desc"
                rows={4}
                value={companyForm.description}
                onChange={(e) =>
                  setCompanyForm({
                    ...companyForm,
                    description: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comp_logo">Update Logo (Optional)</Label>
              <Input
                id="comp_logo"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setCompanyForm({
                    ...companyForm,
                    logo: e.target.files ? e.target.files[0] : null,
                  })
                }
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditCompanyOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={btnLoading}>
                {btnLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE COMPANY MODAL --- */}
      <Dialog open={isDeleteCompanyOpen} onOpenChange={setIsDeleteCompanyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong className="text-foreground">{company?.name}</strong> and all
              associated job listings.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteCompanyOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCompany}
              disabled={btnLoading}
            >
              {btnLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyPage;