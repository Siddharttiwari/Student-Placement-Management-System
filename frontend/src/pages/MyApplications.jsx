
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  Trophy,
} from "lucide-react";

import api from "../api/axios";

function MyApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch applications when page loads
  useEffect(() => {
    let active = true;

    const fetchApplications = async () => {
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

  // Status-based UI configuration
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

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Back Navigation */}
        <Link
          to="/dashboard"
          className="text-red-600 font-semibold hover:underline"
        >
          ← Back to Student Dashboard
        </Link>

        {/* Heading */}
        <div className="mt-7 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            My Applications
          </h1>

          <p className="text-gray-500 mt-2">
            Track your placement applications and recruitment status.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="bg-red-100 text-red-700 p-4 rounded-lg mb-6"
          >
            {error}
          </p>
        )}

        {/* Loading */}
        {loading ? (
          <p className="text-gray-600">
            Loading your applications...
          </p>
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
          <div className="space-y-4">

            {applications.map((application) => {
              const status =
                statusConfig[application.status] ??
                statusConfig.APPLIED;

              const StatusIcon = status.icon;

              return (
                <div
                  key={application.id}
                  className="bg-white border border-red-100 rounded-xl p-6 shadow-sm"
                >

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

                  <div className="border-t border-gray-100 mt-5 pt-4 flex flex-wrap gap-5 text-sm text-gray-600">

                    <p className="flex items-center gap-2">
                      <CalendarDays size={17} className="text-red-600" />
                      Applied:{" "}
                      {new Date(
                        application.applied_at
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                    <p className="flex items-center gap-2">
                      <Clock3 size={17} className="text-red-600" />
                      Last Updated:{" "}
                      {new Date(
                        application.updated_at
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                  </div>

                </div>
              );
            })}

          </div>
        )}

        {/* Browse Jobs */}
        {applications.length > 0 && (
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
