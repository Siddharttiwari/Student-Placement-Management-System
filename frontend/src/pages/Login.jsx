
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api, { initializeCSRF } from "../api/axios";

function Login() {
  const navigate = useNavigate();

  // Selected login tab
  const [selectedRole, setSelectedRole] = useState("STUDENT");

  // Login credentials
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Switch between Student and TPO tabs
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setUsername("");
    setPassword("");
    setError("");
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Step 1: Get CSRF cookie
      await initializeCSRF();

      // Step 2: Authenticate with Django
      const response = await api.post("accounts/login/", {
        username,
        password,
      });

      // Step 3: Get actual role from Django
      const actualRole = response.data.role;

      // Step 4: Check selected role matches actual role
      if (actualRole !== selectedRole) {
        // Authentication succeeded, but user selected wrong tab.
        // End the newly created session.
        await api.post("accounts/logout/");

        setError(
          `This account is not a ${
            selectedRole === "STUDENT" ? "Student" : "TPO"
          } account. Please select the correct login tab.`
        );

        return;
      }

      // Step 5: Redirect based on verified role
      if (actualRole === "STUDENT") {
        navigate("/dashboard", { replace: true });
      } else if (actualRole === "TPO") {
        navigate("/tpo/dashboard", { replace: true });
      }

    } catch (err) {
      console.error("Login error:", err);

      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again.";

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-red-100">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-red-600 text-center">
          Placement Portal
        </h1>

        <p className="text-gray-500 mt-2 mb-6 text-center">
          Sign in to your account
        </p>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-2 bg-red-50 rounded-xl p-1 mb-6">

          <button
            type="button"
            onClick={() => handleRoleChange("STUDENT")}
            disabled={loading}
            aria-pressed={selectedRole === "STUDENT"}
            className={`py-3 rounded-lg font-semibold transition cursor-pointer ${
              selectedRole === "STUDENT"
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-red-100"
            }`}
          >
            Student Login
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange("TPO")}
            disabled={loading}
            aria-pressed={selectedRole === "TPO"}
            className={`py-3 rounded-lg font-semibold transition cursor-pointer ${
              selectedRole === "TPO"
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-red-100"
            }`}
          >
            TPO Login
          </button>

        </div>

        {/* Selected Role Heading */}
        <h2 className="text-xl font-semibold text-gray-800 mb-5">
          {selectedRole === "STUDENT"
            ? "Student Login"
            : "Training & Placement Officer Login"}
        </h2>

        {/* Error Message */}
        {error && (
          <p
            role="alert"
            className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm"
          >
            {error}
          </p>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {loading
              ? "Logging in..."
              : selectedRole === "STUDENT"
              ? "Login as Student"
              : "Login as TPO"}
          </button>

        </form>

        {/* Registration only for students */}
        {selectedRole === "STUDENT" ? (
          <p className="mt-6 text-center text-sm text-gray-600">
            New student?{" "}
            <Link
              to="/register"
              className="text-red-600 font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        ) : (
          <p className="mt-6 text-center text-sm text-gray-500">
            TPO accounts are created by authorized administrators.
          </p>
        )}

      </div>
    </div>
  );
}

export default Login;
