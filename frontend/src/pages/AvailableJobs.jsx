
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  GraduationCap,
  IndianRupee,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import api, { initializeCSRF } from "../api/axios";

function AvailableJobs() {
  const navigate = useNavigate();

  // Store placement drives
  const [jobs, setJobs] = useState([]);

  // Store IDs of drives already applied to
  const [appliedDriveIds, setAppliedDriveIds] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // STEP 1: Fetch jobs and existing applications
  // ==========================================

  useEffect(() => {
    let active = true;

    const fetchJobs = async () => {
      try {
        const [jobsResponse, applicationsResponse] =
          await Promise.all([
            api.get("placements/student/jobs/"),
            api.get("placements/student/applications/"),
          ]);

        if (!active) return;

        setJobs(jobsResponse.data);

        // Extract drive IDs from existing applications
        const appliedIds = applicationsResponse.data.map(
          (application) => application.drive
        );

        setAppliedDriveIds(appliedIds);

      } catch (err) {
        if (!active) return;

        console.error("Available jobs error:", err);

        if ([401, 403].includes(err.response?.status)) {
          navigate("/login", { replace: true });
          return;
        }

        setError("Unable to load available jobs.");

      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      active = false;
    };
  }, [navigate]);

  // ==========================================
  // STEP 2: Apply for a placement drive
  // ==========================================

  const handleApply = async (driveId) => {
    // Prevent multiple requests
    if (
      applyingId !== null ||
      appliedDriveIds.includes(driveId)
    ) {
      return;
    }

    setApplyingId(driveId);
    setError("");
    setSuccess("");

    try {
      // Obtain CSRF cookie
      await initializeCSRF();

      // Submit application to Django
      const response = await api.post(
        `placements/student/jobs/${driveId}/apply/`
      );

      // Update React state without refreshing
      setAppliedDriveIds((prev) =>
        prev.includes(driveId)
          ? prev
          : [...prev, driveId]
      );

      setSuccess(
        response.data.message ||
        "Application submitted successfully!"
      );

    } catch (err) {
      console.error("Job application error:", err);

      if ([401, 403].includes(err.response?.status)) {
        navigate("/login", { replace: true });
        return;
      }

      const details = err.response?.data;

      if (details?.reasons?.length) {
        setError(details.reasons.join(" | "));
      } else if (
        typeof details?.detail === "string"
      ) {
        setError(details.detail);
      } else {
        setError(
          "Unable to submit application. Please try again."
        );
      }

      // Synchronize if the backend reports a duplicate
      if (
        err.response?.status === 400 &&
        typeof details?.detail === "string" &&
        details.detail.toLowerCase().includes("already applied")
      ) {
        setAppliedDriveIds((prev) =>
          prev.includes(driveId)
            ? prev
            : [...prev, driveId]
        );
      }

    } finally {
      setApplyingId(null);
    }
  };

  // ==========================================
  // STEP 3: Render UI
  // ==========================================

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Back Navigation */}
        <Link
          to="/dashboard"
          className="text-red-600 font-semibold hover:underline"
        >
          ← Back to Student Dashboard
        </Link>

        {/* Page Heading */}
        <div className="mt-7 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Available Jobs
          </h1>

          <p className="text-gray-500 mt-2">
            Explore placement opportunities and check
            your eligibility.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <p
            role="alert"
            className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-lg mb-6"
          >
            {error}
          </p>
        )}

        {/* Success Message */}
        {success && (
          <p
            role="status"
            className="bg-green-100 border border-green-200 text-green-700 p-4 rounded-lg mb-6"
          >
            {success}
          </p>
        )}

        {/* Loading State */}
        {loading ? (
          <p className="text-gray-600">
            Loading placement opportunities...
          </p>
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-red-100 rounded-xl p-8 text-center">

            <BriefcaseBusiness
              size={36}
              className="text-red-600 mx-auto mb-3"
            />

            <p className="font-semibold text-gray-800">
              No placement drives available yet.
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {jobs.map((job) => {
              const alreadyApplied =
                appliedDriveIds.includes(job.id);

              const isApplying = applyingId === job.id;

              const buttonDisabled =
                !job.eligible ||
                alreadyApplied ||
                applyingId !== null;

              return (
                <div
                  key={job.id}
                  className="bg-white border border-red-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >

                  {/* Company and Eligibility */}
                  <div className="flex justify-between items-start gap-3">

                    <div>
                      <p className="text-red-600 font-semibold">
                        {job.company_name}
                      </p>

                      <h2 className="text-xl font-bold text-gray-900 mt-1">
                        {job.job_title}
                      </h2>
                    </div>

                    <span
                      className={`text-xs font-semibold px-3 py-2 rounded-full ${
                        job.eligible
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {job.eligible
                        ? "Eligible"
                        : "Not Eligible"}
                    </span>

                  </div>

                  {/* Job Details */}
                  <div className="mt-5 space-y-3 text-sm text-gray-700">

                    <p className="flex items-center gap-2">
                      <MapPin
                        size={17}
                        className="text-red-600"
                      />
                      {job.job_location}
                    </p>

                    <p className="flex items-center gap-2">
                      <IndianRupee
                        size={17}
                        className="text-red-600"
                      />
                      {job.package_lpa} LPA
                    </p>

                    <p className="flex items-center gap-2">
                      <GraduationCap
                        size={17}
                        className="text-red-600"
                      />
                      Minimum CGPA: {job.minimum_cgpa}
                    </p>

                    <p className="flex items-center gap-2">
                      <CalendarDays
                        size={17}
                        className="text-red-600"
                      />
                      Deadline: {job.application_deadline}
                    </p>

                    <p>
                      <span className="font-semibold">
                        Eligible Courses:
                      </span>{" "}
                      {job.eligible_courses}
                    </p>

                    <p>
                      <span className="font-semibold">
                        Status:
                      </span>{" "}
                      {job.status}
                    </p>

                  </div>

                  {/* Job Description */}
                  <div className="mt-5 border-t border-gray-100 pt-4">

                    <h3 className="font-semibold text-gray-900 mb-2">
                      Job Description
                    </h3>

                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {job.job_description}
                    </p>

                  </div>

                  {/* Eligibility Result */}
                  <div className="mt-5 border-t border-gray-100 pt-4">

                    {job.eligible ? (
                      <div className="flex items-center gap-2 text-green-700">

                        <CheckCircle2 size={19} />

                        <p className="text-sm font-semibold">
                          You meet the eligibility requirements.
                        </p>

                      </div>
                    ) : (
                      <div className="text-red-700">

                        <div className="flex items-center gap-2">

                          <XCircle size={19} />

                          <p className="text-sm font-semibold">
                            You are not eligible for this drive.
                          </p>

                        </div>

                        <ul className="list-disc ml-7 mt-2 text-sm space-y-1">
                          {(job.reasons ?? []).map(
                            (reason, index) => (
                              <li key={index}>
                                {reason}
                              </li>
                            )
                          )}
                        </ul>

                      </div>
                    )}

                  </div>

                  {/* Apply Button */}
                  <button
                    type="button"
                    onClick={() => handleApply(job.id)}
                    disabled={buttonDisabled}
                    className={`w-full mt-auto pt-3 pb-3 rounded-lg font-semibold transition ${
                      buttonDisabled
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                    }`}
                  >
                    {alreadyApplied
                      ? "Already Applied"
                      : isApplying
                      ? "Applying..."
                      : job.eligible
                      ? "Apply Now"
                      : "Not Eligible"}
                  </button>

                </div>
              );
            })}

          </div>
        )}

        {/* Application Tracking Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm mb-3">
            Want to track your submitted applications?
          </p>

          <Link
                to="/applications"
                className="text-red-600 font-semibold hover:underline"
                >
                View My Applications →
         </Link>
        </div>

      </div>
    </div>
  );
}

export default AvailableJobs;
