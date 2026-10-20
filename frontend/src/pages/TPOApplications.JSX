
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  BriefcaseBusiness,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Trophy,
  Clock3,
  Search,
  Filter,
  Users,
  ClipboardList,
} from "lucide-react";

import api, { initializeCSRF } from "../api/axios";

// ==========================================
// APPLICATION STATUS STYLES
// ==========================================

const statusStyles = {
  APPLIED: "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
  SELECTED: "bg-green-100 text-green-700",
};

function TPOApplications() {
  const navigate = useNavigate();

  // ==========================================
  // REACT STATES
  // ==========================================

  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New states for search and filtering
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // ==========================================
  // FETCH APPLICATIONS FROM DJANGO
  // ==========================================

  useEffect(() => {
    let active = true;

    const fetchApplications = async () => {
      try {
        const response = await api.get(
          "placements/tpo/applications/"
        );

        if (!active) return;

        setApplications(response.data);
        setError("");

      } catch (err) {
        if (!active) return;

        console.error("TPO applications error:", err);

        if ([401, 403].includes(err.response?.status)) {
          navigate("/login", { replace: true });
          return;
        }

        setError("Unable to load student applications.");

      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchApplications();

    return () => {
      active = false;
    };
  }, [navigate]);

  // ==========================================
  // UPDATE APPLICATION STATUS
  // ==========================================

  const handleStatusUpdate = async (
    applicationId,
    newStatus
  ) => {
    if (updatingId !== null) return;

    setUpdatingId(applicationId);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();

      const response = await api.patch(
        `placements/tpo/applications/${applicationId}/status/`,
        { status: newStatus }
      );

      const updatedApplication =
        response.data.application;

      // Update only the changed application
      setApplications((prev) =>
        prev.map((application) =>
          application.id === applicationId
            ? updatedApplication
            : application
        )
      );

      setSuccess(
        `Application #${applicationId} updated to ${newStatus}.`
      );

    } catch (err) {
      console.error("Status update error:", err);

      if ([401, 403].includes(err.response?.status)) {
        navigate("/login", { replace: true });
        return;
      }

      const details = err.response?.data;

      setError(
        typeof details?.detail === "string"
          ? details.detail
          : "Unable to update application status."
      );

    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // APPLICATION STATISTICS
  // ==========================================

  const applicationStats = {
    total: applications.length,

    applied: applications.filter(
      (app) => app.status === "APPLIED"
    ).length,

    shortlisted: applications.filter(
      (app) => app.status === "SHORTLISTED"
    ).length,

    selected: applications.filter(
      (app) => app.status === "SELECTED"
    ).length,

    rejected: applications.filter(
      (app) => app.status === "REJECTED"
    ).length,
  };

  // ==========================================
  // SEARCH AND FILTER APPLICATIONS
  // ==========================================

  const filteredApplications = applications.filter(
    (application) => {
      const query = search.trim().toLowerCase();

      // Search across multiple fields
      const matchesSearch = [
        application.student_name,
        application.roll_number,
        application.company_name,
        application.job_title,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      );

      // Filter based on application status
      const matchesStatus =
        statusFilter === "ALL" ||
        application.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  // ==========================================
  // RENDER STATUS ACTION BUTTONS
  // ==========================================

  const renderActions = (application) => {
    const isUpdating =
      updatingId === application.id;

    const disabled =
      updatingId !== null;

    if (application.status === "APPLIED") {
      return (
        <div className="flex flex-wrap gap-3 mt-5">

          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              handleStatusUpdate(
                application.id,
                "SHORTLISTED"
              )
            }
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 size={17} />
            {isUpdating ? "Updating..." : "Shortlist"}
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              handleStatusUpdate(
                application.id,
                "REJECTED"
              )
            }
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer"
          >
            <XCircle size={17} />
            Reject
          </button>

        </div>
      );
    }

    if (application.status === "SHORTLISTED") {
      return (
        <div className="flex flex-wrap gap-3 mt-5">

          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              handleStatusUpdate(
                application.id,
                "SELECTED"
              )
            }
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer"
          >
            <Trophy size={17} />
            {isUpdating ? "Updating..." : "Mark Selected"}
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              handleStatusUpdate(
                application.id,
                "REJECTED"
              )
            }
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer"
          >
            <XCircle size={17} />
            Reject
          </button>

        </div>
      );
    }

    return (
      <p className="text-sm text-gray-500 mt-5">
        This application has been finalized.
      </p>
    );
  };

  // ==========================================
  // RENDER PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-red-50 p-6">

      <div className="max-w-6xl mx-auto">

        {/* BACK NAVIGATION */}

        <Link
          to="/tpo/dashboard"
          className="text-red-600 font-semibold hover:underline"
        >
          ← Back to TPO Dashboard
        </Link>

        {/* PAGE HEADING */}

        <div className="mt-7 mb-8">

          <h1 className="text-3xl font-bold text-gray-900">
            Student Applications
          </h1>

          <p className="text-gray-500 mt-2">
            Review applicants, shortlist candidates,
            and manage placement decisions.
          </p>

        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <p
            role="alert"
            className="bg-red-100 text-red-700 p-4 rounded-lg mb-6"
          >
            {error}
          </p>
        )}

        {/* SUCCESS MESSAGE */}

        {success && (
          <p
            role="status"
            className="bg-green-100 text-green-700 p-4 rounded-lg mb-6"
          >
            {success}
          </p>
        )}

        {/* ======================================
            STATISTICS CARDS
        ====================================== */}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">

          {[
            {
              label: "Total",
              value: applicationStats.total,
              icon: ClipboardList,
            },
            {
              label: "Applied",
              value: applicationStats.applied,
              icon: Users,
            },
            {
              label: "Shortlisted",
              value: applicationStats.shortlisted,
              icon: CheckCircle2,
            },
            {
              label: "Selected",
              value: applicationStats.selected,
              icon: Trophy,
            },
            {
              label: "Rejected",
              value: applicationStats.rejected,
              icon: XCircle,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="bg-white border border-red-100 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">

                  <p className="text-sm text-gray-500">
                    {stat.label}
                  </p>

                  <Icon
                    size={19}
                    className="text-red-600"
                  />

                </div>

                <p className="text-3xl font-bold text-red-600 mt-3">
                  {loading ? "..." : stat.value}
                </p>

              </div>
            );
          })}

        </div>

        {/* ======================================
            SEARCH AND FILTER SECTION
        ====================================== */}

        <div className="bg-white border border-red-100 rounded-xl p-5 mb-8 shadow-sm">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* SEARCH INPUT */}

            <div>

              <label
                htmlFor="application-search"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Search Applications
              </label>

              <div className="relative">

                <Search
                  size={19}
                  className="absolute left-3 top-3.5 text-gray-400"
                />

                <input
                  id="application-search"
                  type="search"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Student, roll number, company, job..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
                />

              </div>

            </div>

            {/* STATUS FILTER */}

            <div>

              <label
                htmlFor="status-filter"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Filter by Status
              </label>

              <div className="relative">

                <Filter
                  size={19}
                  className="absolute left-3 top-3.5 text-gray-400 pointer-events-none"
                />

                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="ALL">
                    All Applications
                  </option>

                  <option value="APPLIED">
                    Applied
                  </option>

                  <option value="SHORTLISTED">
                    Shortlisted
                  </option>

                  <option value="SELECTED">
                    Selected
                  </option>

                  <option value="REJECTED">
                    Rejected
                  </option>

                </select>

              </div>

            </div>

          </div>

          {/* RESULT COUNT */}

          <p className="text-sm text-gray-500 mt-4">
            Showing {filteredApplications.length} of{" "}
            {applications.length} applications
          </p>

        </div>

        {/* ======================================
            APPLICATION LIST
        ====================================== */}

        {loading ? (

          <p className="text-gray-600">
            Loading applications...
          </p>

        ) : filteredApplications.length === 0 ? (

          <div className="bg-white border border-red-100 rounded-xl p-8 text-center">

            <BriefcaseBusiness
              size={36}
              className="mx-auto text-red-600 mb-3"
            />

            <p className="font-semibold text-gray-900">
              {applications.length === 0
                ? "No student applications found."
                : "No applications match your search or filter."}
            </p>

            {applications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                }}
                className="mt-4 text-red-600 font-semibold hover:underline cursor-pointer"
              >
                Clear Filters
              </button>
            )}

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {filteredApplications.map((application) => (

              <div
                key={application.id}
                className="bg-white border border-red-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >

                {/* COMPANY AND JOB DETAILS */}

                <div className="flex justify-between items-start gap-3">

                  <div>

                    <p className="font-semibold text-red-600">
                      {application.company_name}
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 mt-1">
                      {application.job_title}
                    </h2>

                    <p className="text-xs text-gray-500 mt-1">
                      Application #{application.id}
                    </p>

                  </div>

                  {/* STATUS BADGE */}

                  <span
                    className={`text-xs font-semibold px-3 py-2 rounded-full ${
                      statusStyles[application.status] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {application.status}
                  </span>

                </div>

                {/* STUDENT INFORMATION */}

                <div className="border-t border-gray-100 mt-5 pt-4 space-y-3 text-sm text-gray-700">

                  <p className="font-semibold text-gray-900">
                    {application.student_name}
                  </p>

                  <p>
                    Roll Number: {application.roll_number}
                  </p>

                  <p className="flex items-center gap-2">

                    <GraduationCap
                      size={17}
                      className="text-red-600"
                    />

                    {application.course} | CGPA:{" "}
                    {application.cgpa}

                  </p>

                  <p className="flex items-center gap-2">

                    <Clock3
                      size={17}
                      className="text-red-600"
                    />

                    Applied:{" "}
                    {new Date(
                      application.applied_at
                    ).toLocaleDateString("en-IN")}

                  </p>

                </div>

                {/* STATUS ACTION BUTTONS */}

                {renderActions(application)}

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default TPOApplications;
