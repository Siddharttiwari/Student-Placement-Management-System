
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  GraduationCap,
  Building2,
  BriefcaseBusiness,
  FileText,
  LogOut,
  ArrowRight,
} from "lucide-react";

import api, { initializeCSRF } from "../api/axios";

// ==========================================
// DASHBOARD CARDS CONFIGURATION
// ==========================================

const dashboardCards = [
  {
    title: "Total Students",
    description: "Manage student accounts and profiles",
    icon: GraduationCap,
    key: "total_students",
    link: "/tpo/students",
    linkText: "Manage Students",
  },
  {
    title: "Companies",
    description: "Manage recruiting companies",
    icon: Building2,
    key: "total_companies",
    link: "/tpo/companies",
    linkText: "Manage Companies",
  },
  {
    title: "Placement Drives",
    description: "Create and manage placement drives",
    icon: BriefcaseBusiness,
    key: "total_drives",
    link: "/tpo/drives",
    linkText: "Manage Drives",
  },
  {
    title: "Applications",
    description: "Review student applications",
    icon: FileText,
    key: "total_applications",
    link: "/tpo/applications",
    linkText: "Manage Applications",
  },
];

// ==========================================
// PLACEMENT WORKFLOW CONFIGURATION
// ==========================================

const workflowSteps = [
  {
    step: "01",
    title: "Manage Students",
    description: "Register students and manage account access.",
  },
  {
    step: "02",
    title: "Add Companies",
    description: "Register recruiting companies.",
  },
  {
    step: "03",
    title: "Create Drives",
    description: "Publish placement opportunities.",
  },
  {
    step: "04",
    title: "Review Applications",
    description: "Review and shortlist eligible candidates.",
  },
  {
    step: "05",
    title: "Manage Recruitment",
    description: "Conduct and evaluate recruitment rounds.",
  },
  {
    step: "06",
    title: "Select Students",
    description: "Finalize placement decisions.",
  },
];

function TPODashboard() {
  const navigate = useNavigate();

  // ==========================================
  // REACT STATE
  // ==========================================

  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // FETCH DASHBOARD STATISTICS
  // ==========================================

  useEffect(() => {
    let active = true;

    const fetchDashboardStats = async () => {
      try {
        const response = await api.get(
          "tpo/dashboard/"
        );

        if (!active) return;

        setStats(response.data);
        setError("");
      } catch (err) {
        if (!active) return;

        console.error(
          "TPO dashboard error:",
          err
        );

        if ([401, 403].includes(err.response?.status)) {
          navigate("/login", {
            replace: true,
          });
          return;
        }

        setError(
          "Unable to load dashboard statistics."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboardStats();

    return () => {
      active = false;
    };
  }, [navigate]);

  // ==========================================
  // LOGOUT FUNCTION
  // ==========================================

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      await initializeCSRF();

      await api.post(
        "accounts/logout/"
      );

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Logout error:",
        err
      );

      setError(
        "Unable to log out. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  // ==========================================
  // RENDER DASHBOARD
  // ==========================================

  return (
    <div className="min-h-screen bg-red-50">

      {/* NAVIGATION BAR */}

      <nav className="bg-white border-b border-red-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">

          <div>
            <h1 className="text-xl font-bold text-red-600">
              Placement Portal
            </h1>

            <p className="text-xs text-gray-500 mt-1">
              Training & Placement Officer
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 border border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <LogOut size={18} />

            {loggingOut
              ? "Logging out..."
              : "Logout"}
          </button>

        </div>
      </nav>

      {/* MAIN CONTENT */}

      <main className="max-w-6xl mx-auto p-6">

        {/* DASHBOARD HEADING */}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            TPO Dashboard
          </h2>

          <p className="text-gray-500 mt-2">
            Manage students, companies, recruitment drives,
            applications and placement decisions.
          </p>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-lg mb-6"
          >
            {error}
          </div>
        )}

        {/* STATISTICS CARDS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {dashboardCards.map((card) => {
            const Icon = card.icon;

            const count = loading
              ? "..."
              : stats?.[card.key] ?? "—";

            return (
              <div
                key={card.key}
                className="bg-white border border-red-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >

                {/* CARD ICON */}

                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                  <Icon
                    size={24}
                    className="text-red-600"
                  />
                </div>

                {/* CARD TITLE */}

                <h3 className="font-bold text-gray-900">
                  {card.title}
                </h3>

                {/* CARD DESCRIPTION */}

                <p className="text-sm text-gray-500 mt-2 min-h-10">
                  {card.description}
                </p>

                {/* DYNAMIC STATISTICS */}

                <p className="text-3xl font-bold text-red-600 mt-4">
                  {count}
                </p>

                {/* NAVIGATION LINK */}

                <Link
                  to={card.link}
                  className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-red-600 hover:underline"
                >
                  {card.linkText}
                  <ArrowRight size={16} />
                </Link>

              </div>
            );
          })}

        </div>

        {/* PLACEMENT MANAGEMENT SECTION */}

        <div className="mt-8 bg-white border border-red-100 rounded-xl p-6 shadow-sm">

          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Placement Management
          </h3>

          <p className="text-gray-600 text-sm leading-6">
            Manage student accounts, register recruiting companies,
            create placement drives, review applications, and track
            recruitment progress from one dashboard.
          </p>

          {/* QUICK ACTIONS */}

          <div className="flex flex-wrap gap-3 mt-5">

            <Link
              to="/tpo/students"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 font-medium transition"
            >
              <GraduationCap size={17} />
              Manage Students
            </Link>

            <Link
              to="/tpo/companies"
              className="inline-flex items-center gap-2 border border-red-600 text-red-600 px-5 py-2 rounded-lg hover:bg-red-50 font-medium transition"
            >
              <Building2 size={17} />
              Manage Companies
            </Link>

            <Link
              to="/tpo/drives"
              className="inline-flex items-center gap-2 border border-red-600 text-red-600 px-5 py-2 rounded-lg hover:bg-red-50 font-medium transition"
            >
              <BriefcaseBusiness size={17} />
              Manage Drives
            </Link>

            <Link
              to="/tpo/applications"
              className="inline-flex items-center gap-2 border border-red-600 text-red-600 px-5 py-2 rounded-lg hover:bg-red-50 font-medium transition"
            >
              <FileText size={17} />
              Manage Applications
            </Link>

          </div>
        </div>

        {/* PLACEMENT WORKFLOW SECTION */}

        <div className="mt-6 bg-white border border-red-100 rounded-xl p-6 shadow-sm">

          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Placement Workflow
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {workflowSteps.map((item) => (
              <div
                key={item.step}
                className="bg-red-50 border border-red-100 rounded-lg p-4"
              >
                <p className="text-red-600 font-bold text-sm">
                  STEP {item.step}
                </p>

                <h4 className="font-semibold text-gray-900 mt-2">
                  {item.title}
                </h4>

                <p className="text-sm text-gray-600 mt-2">
                  {item.description}
                </p>
              </div>
            ))}

          </div>
        </div>

      </main>
    </div>
  );
}

export default TPODashboard;
