
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { initializeCSRF } from "../api/axios";

function StudentDashboard() {
  const navigate = useNavigate();

  // State variables
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Fetch student data from Django
  useEffect(() => {
    let active = true;

    const fetchStudent = async () => {
      try {
        const response = await api.get("students/me/");

        if (active) {
          setStudent(response.data);
        }
      } catch (err) {
        if (!active) return;

        console.error("Profile fetch error:", err);

        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          navigate("/login", { replace: true });
          return;
        }

        setError("Unable to load student profile.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchStudent();

    return () => {
      active = false;
    };
  }, [navigate]);

  // Logout function
  const handleLogout = async () => {
    setLoggingOut(true);
    setError("");

    try {
      await initializeCSRF();

      await api.post("accounts/logout/");

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      setError("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <p className="text-red-600 text-lg font-semibold">
          Loading dashboard...
        </p>
      </div>
    );
  }

  // Error state
  if (error && !student) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <div className="min-h-screen bg-red-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-red-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">

          <h1 className="text-xl font-bold text-red-600">
            Student Placement Portal
          </h1>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>

        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">

        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome, {student.full_name}!
        </h2>

        <p className="text-gray-500 mb-8">
          Here is your placement dashboard.
        </p>

        {/* Display errors */}
        {error && (
          <div
            role="alert"
            className="bg-red-100 text-red-700 p-4 rounded-lg mb-6"
          >
            {error}
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* My Profile Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">

            <h3 className="text-lg font-semibold text-red-600 mb-4">
              My Profile
            </h3>

            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-semibold">Roll No:</span>{" "}
                {student.roll_number}
              </p>

              <p>
                <span className="font-semibold">Course:</span>{" "}
                {student.course}
              </p>

              <p>
                <span className="font-semibold">Branch:</span>{" "}
                {student.branch}
              </p>

              <p>
                <span className="font-semibold">CGPA:</span>{" "}
                {student.cgpa}
              </p>
            </div>

            {/* Profile Navigation */}
            <Link
              to="/profile"
              className="inline-block mt-5 text-red-600 font-semibold hover:underline"
            >
              View Full Profile →
            </Link>

          </div>

          
          {/* Available Jobs Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-shadow">

            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Available Jobs
            </h3>

            <p className="text-gray-500">
              Explore placement opportunities posted by companies.
              Check eligibility based on your CGPA and course.
            </p>

            <Link
              to="/jobs"
              className="inline-block mt-5 text-red-600 font-semibold hover:underline"
            >
              Browse Jobs →
            </Link>

          </div>


          
            {/* My Applications Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-shadow">

              <h3 className="text-lg font-semibold text-red-600 mb-4">
                My Applications
              </h3>

              <p className="text-gray-500">
                Track your submitted job applications and
                recruitment status.
              </p>

              <Link
                to="/applications"
                className="inline-block mt-5 text-red-600 font-semibold hover:underline"
              >
                View My Applications →
              </Link>

            </div>


        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;
