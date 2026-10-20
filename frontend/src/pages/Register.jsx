
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { initializeCSRF } from "../api/axios";

const initialForm = {
  username: "",
  email: "",
  full_name: "",
  roll_number: "",
  course: "",
  branch: "",
  cgpa: "",
  graduation_year: "",
  phone_number: "",
  password: "",
  confirm_password: "",
};

const fields = [
  { name: "username", label: "Username", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "full_name", label: "Full Name", type: "text" },
  { name: "roll_number", label: "Roll Number", type: "text" },
  { name: "course", label: "Course", type: "text" },
  { name: "branch", label: "Branch", type: "text" },
  { name: "cgpa", label: "CGPA", type: "number" },
  { name: "graduation_year", label: "Graduation Year", type: "number" },
  { name: "phone_number", label: "Phone Number", type: "tel" },
  { name: "password", label: "Password", type: "password" },
  { name: "confirm_password", label: "Confirm Password", type: "password" },
];

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Update input values
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // Submit registration form
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setFieldErrors({});

    // Client-side password confirmation
    if (formData.password !== formData.confirm_password) {
      setFieldErrors({
        confirm_password: "Passwords do not match.",
      });
      return;
    }

    if (formData.password.length < 8) {
      setFieldErrors({
        password: "Password must be at least 8 characters.",
      });
      return;
    }

    setLoading(true);

    try {
      await initializeCSRF();

      // confirm_password is only for frontend validation
      const { confirm_password, ...registrationData } = formData;

      const response = await api.post(
        "accounts/register/",
        registrationData
      );

      console.log("Registration successful:", response.data);

      // Navigate to login after successful registration
      navigate("/login", {
        replace: true,
        state: {
          message: "Registration successful! Please log in.",
        },
      });
    } catch (err) {
      console.error("Registration error:", err);

      const details = err.response?.data;

      if (details && typeof details === "object") {
        const errors = {};

        Object.entries(details).forEach(([field, messages]) => {
          errors[field] = Array.isArray(messages)
            ? messages.join(", ")
            : String(messages);
        });

        setFieldErrors(errors);

        if (details.detail) {
          setError(String(details.detail));
        } else {
          setError("Please correct the highlighted fields.");
        }
      } else {
        setError(
          err.message || "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-red-600">
          Student Registration
        </h1>

        <p className="text-slate-500 mt-2 mb-6">
          Create your placement portal account
        </p>

        {/* General error */}
        {error && (
          <div
            role="alert"
            className="bg-red-100 text-red-700 p-3 rounded-lg mb-5"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {fields.map((field) => (
              <div key={field.name}>

                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {field.label}
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  required
                  min={
                    field.name === "cgpa"
                      ? "0"
                      : field.name === "graduation_year"
                      ? "2000"
                      : undefined
                  }
                  max={field.name === "cgpa" ? "10" : undefined}
                  step={field.name === "cgpa" ? "0.01" : undefined}
                  minLength={
                    field.name === "password" ||
                    field.name === "confirm_password"
                      ? 8
                      : undefined
                  }
                  maxLength={
                    field.name === "roll_number"
                      ? 30
                      : field.name === "full_name"
                      ? 150
                      : field.name === "course" ||
                        field.name === "branch"
                      ? 100
                      : field.name === "phone_number"
                      ? 15
                      : undefined
                  }
                  aria-invalid={Boolean(fieldErrors[field.name])}
                  className={`border rounded-lg p-3 w-full focus:outline-none focus:ring-2 ${
                    fieldErrors[field.name]
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-red-400"
                  }`}
                />

                {fieldErrors[field.name] && (
                  <p className="text-red-600 text-sm mt-1">
                    {fieldErrors[field.name]}
                  </p>
                )}

              </div>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-7 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already registered?{" "}
          <Link
            to="/login"
            className="text-red-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;
