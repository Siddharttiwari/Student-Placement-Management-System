
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { initializeCSRF } from "../api/axios";

function StudentProfile() {
  const navigate = useNavigate();

  // Student information
  const [student, setStudent] = useState(null);

  // Editable profile fields
  const [formData, setFormData] = useState({
    full_name: "",
    cgpa: "",
    phone_number: "",
  });

  // Resume upload
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);

  // UI states
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch student profile from Django
  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const response = await api.get("students/me/");

        if (!active) return;

        const data = response.data;

        setStudent(data);

        setFormData({
          full_name: data.full_name ?? "",
          cgpa: data.cgpa ?? "",
          phone_number: data.phone_number ?? "",
        });
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

    fetchProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  // Update controlled form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save profile information
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();

      const response = await api.patch(
        "students/me/",
        formData
      );

      const updatedProfile = response.data.profile;

      setStudent(updatedProfile);

      setFormData({
        full_name: updatedProfile.full_name ?? "",
        cgpa: updatedProfile.cgpa ?? "",
        phone_number: updatedProfile.phone_number ?? "",
      });

      setEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        navigate("/login", { replace: true });
        return;
      }

      const details = err.response?.data;

      if (details && typeof details === "object") {
        setError(
          Object.entries(details)
            .map(([field, messages]) =>
              `${field}: ${
                Array.isArray(messages)
                  ? messages.join(", ")
                  : String(messages)
              }`
            )
            .join(" | ")
        );
      } else {
        setError("Unable to update profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Cancel profile editing
  const handleCancel = () => {
    setFormData({
      full_name: student.full_name ?? "",
      cgpa: student.cgpa ?? "",
      phone_number: student.phone_number ?? "",
    });

    setEditing(false);
    setError("");
  };

  // Select resume file
  const handleResumeChange = (e) => {
    const file = e.target.files?.[0] ?? null;

    setResumeFile(null);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    if (!file) return;

    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume size must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    setResumeFile(file);
  };

  // Upload resume to Django
  const handleResumeUpload = async () => {
    if (!resumeFile) {
      setError("Please select a resume first.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();

      const data = new FormData();
      data.append("resume", resumeFile);

      const response = await api.patch(
        "students/me/",
        data,
        {
          onUploadProgress: (event) => {
            if (event.total) {
              const progress = Math.round(
                (event.loaded * 100) / event.total
              );

              setUploadProgress(progress);
            }
          },
        }
      );

      const updatedProfile = response.data.profile;

      setStudent(updatedProfile);
      setResumeFile(null);
      setUploadProgress(100);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccess("Resume uploaded successfully!");
    } catch (err) {
      console.error("Resume upload error:", err);

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        navigate("/login", { replace: true });
        return;
      }

      const details = err.response?.data;

      if (details?.resume) {
        setError(
          Array.isArray(details.resume)
            ? details.resume.join(", ")
            : String(details.resume)
        );
      } else {
        setError("Unable to upload resume. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <p className="text-red-600">
          Loading student profile...
        </p>
      </div>
    );
  }

  // Error screen
  if (!student) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <p className="text-red-600">
          {error || "Student profile not found."}
        </p>
      </div>
    );
  }

  const fields = [
    ["Full Name", student.full_name],
    ["Username", student.username],
    ["Email", student.email],
    ["Roll Number", student.roll_number],
    ["Course", student.course],
    ["Branch", student.branch],
    ["CGPA", student.cgpa],
    ["Graduation Year", student.graduation_year],
    ["Phone Number", student.phone_number],
  ];

  // Convert relative resume URL to backend URL
  const resumeUrl = student.resume
    ? new URL(
        student.resume,
        api.defaults.baseURL
      ).href
    : null;

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Back Navigation */}
        <Link
          to="/dashboard"
          className="text-red-600 font-semibold hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 mt-6">

          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-red-600">
              My Student Profile
            </h1>

            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setError("");
                  setSuccess("");
                }}
                disabled={uploading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <p
              role="status"
              className="bg-green-100 text-green-700 p-3 rounded-lg mb-4"
            >
              {success}
            </p>
          )}

          {/* Error Message */}
          {error && (
            <p
              role="alert"
              className="bg-red-100 text-red-700 p-3 rounded-lg mb-4"
            >
              {error}
            </p>
          )}

          {!editing ? (
            // View Mode
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(([label, value]) => (
                <div
                  key={label}
                  className="bg-gray-50 p-4 rounded-lg"
                >
                  <p className="text-sm text-gray-500">
                    {label}
                  </p>

                  <p className="font-semibold text-gray-800 mt-1">
                    {value === null ||
                    value === undefined ||
                    value === ""
                      ? "Not provided"
                      : value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            // Edit Mode
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Full Name */}
              <div>
                <label
                  htmlFor="full_name"
                  className="block font-medium text-gray-700 mb-2"
                >
                  Full Name
                </label>

                <input
                  id="full_name"
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* CGPA */}
              <div>
                <label
                  htmlFor="cgpa"
                  className="block font-medium text-gray-700 mb-2"
                >
                  CGPA
                </label>

                <input
                  id="cgpa"
                  type="number"
                  name="cgpa"
                  value={formData.cgpa}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  step="0.01"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone_number"
                  className="block font-medium text-gray-700 mb-2"
                >
                  Phone Number
                </label>

                <input
                  id="phone_number"
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Save and Cancel */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving || uploading}
                  className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-60 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Resume Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">

            <h2 className="text-xl font-semibold text-red-600 mb-2">
              My Resume
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              Upload a PDF resume (maximum 5 MB).
            </p>

            {/* Existing Resume */}
            {resumeUrl ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
                <p className="text-green-700 font-medium mb-2">
                  Resume uploaded
                </p>

                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 font-semibold hover:underline"
                >
                  View Resume →
                </a>
              </div>
            ) : (
              <p className="text-gray-500 mb-5">
                No resume uploaded yet.
              </p>
            )}

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleResumeChange}
              disabled={uploading || saving}
              className="block w-full border border-gray-300 rounded-lg p-3 text-sm"
            />

            {/* Selected File */}
            {resumeFile && (
              <p className="text-sm text-gray-600 mt-3">
                Selected: {resumeFile.name}
              </p>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  {uploadProgress}% transferred
                </p>
              </div>
            )}

            {/* Upload Button */}
            <button
              type="button"
              onClick={handleResumeUpload}
              disabled={!resumeFile || uploading || saving}
              className="mt-4 bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 cursor-pointer"
            >
              {uploading
                ? "Uploading..."
                : resumeUrl
                ? "Replace Resume"
                : "Upload Resume"}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
