
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  Trophy,
  ListChecks,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

import api from "../api/axios";

// Application status configuration
const statusConfig = {
  APPLIED: {
    label: "Applied",
    color: "bg-blue-100 text-blue-700",
    icon: Clock3,
  },
  SHORTLISTED: {
    label: "Shortlisted",
    color: "bg-amber-100 text-amber-700",
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    label: "Recruitment In Progress",
    color: "bg-purple-100 text-purple-700",
    icon: ListChecks,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  SELECTED: {
    label: "Selected",
    color: "bg-green-100 text-green-700",
    icon: Trophy,
  },
};

function MyApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------------------------------
  // FETCH STUDENT APPLICATIONS
  // ---------------------------------------

  useEffect(() => {
    let active = true;

    const fetchApplications = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          "placements/student/applications/"
        );

        if (!active) return;

        setApplications(response.data);
      } catch (err) {
        if (!active) return;

        console.error("Applications fetch error:", err);

        if ([401, 403].includes(err.response?.status)) {
          navigate("/login", { replace: true });
          return;
        }

        setError("Unable to load your applications.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchApplications();

    return () => {
      active = false;
    };
  }, [navigate]);

  // ---------------------------------------
  // DATE FORMATTING
  // ---------------------------------------

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* BACK NAVIGATION */}

        <Link
          to="/dashboard"
          className="text-red-600 font-semibold hover:underline"
        >
          ← Back to Student Dashboard
        </Link>

        {/* PAGE HEADING */}

        <div className="mt-7 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            My Applications
          </h1>

          <p className="text-gray-500 mt-2">
            Track your placement applications,
            recruitment rounds, and final results.
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

        {/* LOADING */}

        {loading ? (
          <div className="flex items-center gap-3 text-gray-600">
            <LoaderCircle
              size={22}
              className="animate-spin text-red-600"
            />
            Loading your applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white border border-red-100 rounded-xl p-8 text-center">

            <BriefcaseBusiness
              size={38}
              className="text-red-600 mx-auto mb-3"
            />

            <p className="font-semibold text-gray-800">
              You haven't applied for any jobs yet.
            </p>

            <Link
              to="/jobs"
              className="inline-block mt-4 text-red-600 font-semibold hover:underline"
            >
              Browse Available Jobs →
            </Link>
          </div>
        ) : (
          <div className="space-y-5">

            {applications.map((application) => {
              const status =
                statusConfig[application.status] ??
                statusConfig.APPLIED;

              const StatusIcon = status.icon;

              const isSelected =
                application.status === "SELECTED";

              const isRejected =
                application.status === "REJECTED";

              return (
                <div
                  key={application.id}
                  className="bg-white border border-red-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >

                  {/* COMPANY, JOB AND STATUS */}

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">

                    <div>
                      <p className="text-red-600 font-semibold">
                        {application.company_name}
                      </p>

                      <h2 className="text-xl font-bold text-gray-900 mt-1">
                        {application.job_title}
                      </h2>

                      <p className="text-sm text-gray-500 mt-2">
                        Application #{application.id}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold self-start ${status.color}`}
                    >
                      <StatusIcon size={17} />
                      {status.label}
                    </span>
                  </div>

                  {/* APPLICATION DATES */}

                  <div className="border-t border-gray-100 mt-5 pt-4 flex flex-wrap gap-5 text-sm text-gray-600">

                    <p className="flex items-center gap-2">
                      <CalendarDays
                        size={17}
                        className="text-red-600"
                      />

                      Applied:{" "}
                      {formatDate(application.applied_at)}
                    </p>

                    <p className="flex items-center gap-2">
                      <Clock3
                        size={17}
                        className="text-red-600"
                      />

                      Last Updated:{" "}
                      {formatDate(application.updated_at)}
                    </p>
                  </div>

                  {/* FINAL APPLICATION MESSAGE */}

                  {isSelected && (
                    <div className="mt-5 bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                        <Trophy size={18} />
                        Congratulations! You have been selected.
                      </p>
                    </div>
                  )}

                  {isRejected && (
                    <div className="mt-5 bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                        <XCircle size={18} />
                        Your application was not selected.
                      </p>
                    </div>
                  )}

                  {/* RECRUITMENT PROGRESS LINK */}

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <Link
                      to={`/student/applications/${application.id}/rounds`}
                      className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors"
                    >
                      <ListChecks size={18} />

                      View Recruitment Progress

                      <ArrowRight size={17} />
                    </Link>

                    <p className="text-xs text-gray-500 mt-3">
                      View recruitment rounds, qualification
                      results, and your application progress.
                    </p>
                  </div>

                </div>
              );
            })}

          </div>
        )}

        {/* BROWSE MORE JOBS */}

        {!loading && applications.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/jobs"
              className="text-red-600 font-semibold hover:underline"
            >
              Explore More Jobs →
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default MyApplications;
