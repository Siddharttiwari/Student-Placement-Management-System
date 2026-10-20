
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

import api, { initializeCSRF } from "../api/axios";

const emptyForm = {
  company: "",
  job_title: "",
  job_description: "",
  job_location: "",
  package_lpa: "",
  minimum_cgpa: "",
  eligible_courses: "",
  application_deadline: "",
  status: "UPCOMING",
};

function PlacementDriveManagement() {
  const navigate = useNavigate();

  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Display Django validation errors
  const handleApiError = (err, fallback) => {
    if ([401, 403].includes(err.response?.status)) {
      navigate("/login", { replace: true });
      return;
    }

    const details = err.response?.data;

    if (details && typeof details === "object") {
      setError(
        Object.entries(details)
          .map(([field, messages]) => {
            const message = Array.isArray(messages)
              ? messages.join(", ")
              : String(messages);

            return `${field}: ${message}`;
          })
          .join(" | ")
      );
    } else {
      setError(fallback);
    }
  };

  // Fetch companies and placement drives
  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const [companyResponse, driveResponse] =
          await Promise.all([
            api.get("companies/"),
            api.get("placements/drives/"),
          ]);

        if (!active) return;

        const companyData = companyResponse.data;
        const driveData = driveResponse.data;

        setCompanies(
          Array.isArray(companyData)
            ? companyData
            : companyData.results ?? []
        );

        setDrives(
          Array.isArray(driveData)
            ? driveData
            : driveData.results ?? []
        );
      } catch (err) {
        if (!active) return;

        console.error("Placement drive fetch error:", err);
        handleApiError(err, "Unable to load placement drives.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open Add Drive form
  const openAddForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // Open Edit Drive form
  const openEditForm = (drive) => {
    setFormData({
      company: String(drive.company ?? ""),
      job_title: drive.job_title ?? "",
      job_description: drive.job_description ?? "",
      job_location: drive.job_location ?? "",
      package_lpa: drive.package_lpa ?? "",
      minimum_cgpa: drive.minimum_cgpa ?? "",
      eligible_courses: drive.eligible_courses ?? "",
      application_deadline: drive.application_deadline ?? "",
      status: drive.status ?? "UPCOMING",
    });

    setEditingId(drive.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
    setError("");
  };

  // Create or update placement drive
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();

      const payload = {
        ...formData,
        company: Number(formData.company),
      };

      if (editingId !== null) {
        const response = await api.patch(
          `placements/drives/${editingId}/`,
          payload
        );

        setDrives((prev) =>
          prev.map((drive) =>
            drive.id === editingId ? response.data : drive
          )
        );

        setSuccess("Placement drive updated successfully!");
      } else {
        const response = await api.post(
          "placements/drives/",
          payload
        );

        setDrives((prev) => [response.data, ...prev]);

        setSuccess("Placement drive created successfully!");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ ...emptyForm });
    } catch (err) {
      console.error("Placement drive save error:", err);
      handleApiError(err, "Unable to save placement drive.");
    } finally {
      setSaving(false);
    }
  };

  // Delete placement drive
  const handleDelete = async (drive) => {
    const confirmed = window.confirm(
      `Delete the ${drive.job_title} drive at ${drive.company_name}?`
    );

    if (!confirmed) return;

    setDeletingId(drive.id);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();

      await api.delete(`placements/drives/${drive.id}/`);

      setDrives((prev) =>
        prev.filter((item) => item.id !== drive.id)
      );

      setSuccess("Placement drive deleted successfully!");
    } catch (err) {
      console.error("Placement drive delete error:", err);
      handleApiError(err, "Unable to delete placement drive.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-6xl mx-auto">

        <Link
          to="/tpo/dashboard"
          className="text-red-600 font-semibold hover:underline"
        >
          ← Back to TPO Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mt-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Placement Drive Management
            </h1>
            <p className="text-gray-500 mt-2">
              Create and manage recruitment opportunities.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            disabled={saving || loading || companies.length === 0}
            className="flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Plus size={18} />
            Add Placement Drive
          </button>
        </div>

        {error && (
          <p role="alert" className="bg-red-100 text-red-700 p-3 rounded-lg mb-5">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="bg-green-100 text-green-700 p-3 rounded-lg mb-5">
            {success}
          </p>
        )}

        {!loading && companies.length === 0 && (
          <p className="bg-white border border-red-100 rounded-lg p-4 mb-5">
            Add a company before creating a placement drive.{" "}
            <Link to="/tpo/companies" className="text-red-600 font-semibold hover:underline">
              Manage Companies →
            </Link>
          </p>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold text-red-600 mb-5">
              {editingId !== null
                ? "Edit Placement Drive"
                : "Add Placement Drive"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Company Dropdown */}
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">
                    Company
                  </label>
                  <select
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-3"
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Title */}
                <div>
                  <label htmlFor="job_title" className="block text-sm font-medium mb-2">
                    Job Title
                  </label>
                  <input
                    id="job_title"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="Python Developer"
                  />
                </div>

                {/* Job Location */}
                <div>
                  <label htmlFor="job_location" className="block text-sm font-medium mb-2">
                    Job Location
                  </label>
                  <input
                    id="job_location"
                    name="job_location"
                    value={formData.job_location}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="Noida"
                  />
                </div>

                {/* Package */}
                <div>
                  <label htmlFor="package_lpa" className="block text-sm font-medium mb-2">
                    Package (LPA)
                  </label>
                  <input
                    id="package_lpa"
                    name="package_lpa"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.package_lpa}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="6.50"
                  />
                </div>

                {/* Minimum CGPA */}
                <div>
                  <label htmlFor="minimum_cgpa" className="block text-sm font-medium mb-2">
                    Minimum CGPA
                  </label>
                  <input
                    id="minimum_cgpa"
                    name="minimum_cgpa"
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={formData.minimum_cgpa}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="7.00"
                  />
                </div>

                {/* Eligible Courses */}
                <div>
                  <label htmlFor="eligible_courses" className="block text-sm font-medium mb-2">
                    Eligible Courses
                  </label>
                  <input
                    id="eligible_courses"
                    name="eligible_courses"
                    value={formData.eligible_courses}
                    onChange={handleChange}
                    required
                    maxLength={255}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="MCA,BCA,B.Tech"
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label htmlFor="application_deadline" className="block text-sm font-medium mb-2">
                    Application Deadline
                  </label>
                  <input
                    id="application_deadline"
                    name="application_deadline"
                    type="date"
                    value={formData.application_deadline}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-3"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label htmlFor="job_description" className="block text-sm font-medium mb-2">
                  Job Description
                </label>
                <textarea
                  id="job_description"
                  name="job_description"
                  rows={4}
                  value={formData.job_description}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg p-3"
                  placeholder="Describe the role, responsibilities and required skills..."
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Drive"
                    : "Create Drive"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Drive List */}
        <div className="bg-white border border-red-100 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <BriefcaseBusiness size={20} className="text-red-600" />
            <h2 className="font-bold">
              Placement Drives ({drives.length})
            </h2>
          </div>

          {loading ? (
            <p className="p-6 text-gray-500">Loading placement drives...</p>
          ) : drives.length === 0 ? (
            <p className="p-6 text-gray-500">
              No placement drives added yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-red-50">
                  <tr>
                    <th className="p-4">Company</th>
                    <th className="p-4">Job Title</th>
                    <th className="p-4">Package</th>
                    <th className="p-4">Min CGPA</th>
                    <th className="p-4">Deadline</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {drives.map((drive) => (
                    <tr key={drive.id} className="border-t border-gray-100">
                      <td className="p-4 font-medium">
                        {drive.company_name}
                      </td>

                      <td className="p-4">{drive.job_title}</td>

                      <td className="p-4">
                        {drive.package_lpa} LPA
                      </td>

                      <td className="p-4">
                        {drive.minimum_cgpa}
                      </td>

                      <td className="p-4">
                        {drive.application_deadline}
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-red-600">
                          {drive.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => openEditForm(drive)}
                            disabled={deletingId !== null}
                            className="flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(drive)}
                            disabled={deletingId !== null}
                            className="flex items-center gap-1 text-red-600 hover:underline disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            {deletingId === drive.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default PlacementDriveManagement;
