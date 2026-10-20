
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Pencil, Trash2, Plus } from "lucide-react";
import api, { initializeCSRF } from "../api/axios";

const emptyForm = {
  name: "",
  industry: "",
  website: "",
  location: "",
  description: "",
};

function CompanyManagement() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  // Fetch companies from Django
  useEffect(() => {
    let active = true;

    const fetchCompanies = async () => {
      try {
        const response = await api.get("companies/");

        if (active) {
          const data = response.data;
          setCompanies(Array.isArray(data) ? data : data.results ?? []);
        }
      } catch (err) {
        if (!active) return;
        console.error("Company fetch error:", err);
        handleApiError(err, "Unable to load companies.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCompanies();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const openEditForm = (company) => {
    setFormData({
      name: company.name ?? "",
      industry: company.industry ?? "",
      website: company.website ?? "",
      location: company.location ?? "",
      description: company.description ?? "",
    });

    setEditingId(company.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
  };

  // Create or update company
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();

      if (editingId !== null) {
        const response = await api.patch(
          `companies/${editingId}/`,
          formData
        );

        setCompanies((prev) =>
          prev.map((company) =>
            company.id === editingId ? response.data : company
          )
        );

        setSuccess("Company updated successfully!");
      } else {
        const response = await api.post("companies/", formData);

        setCompanies((prev) => [...prev, response.data]);

        setSuccess("Company added successfully!");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch (err) {
      console.error("Company save error:", err);
      handleApiError(err, "Unable to save company.");
    } finally {
      setSaving(false);
    }
  };

  // Delete company
  const handleDelete = async (company) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${company.name}?`
    );

    if (!confirmed) return;

    setDeletingId(company.id);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();
      await api.delete(`companies/${company.id}/`);

      setCompanies((prev) =>
        prev.filter((item) => item.id !== company.id)
      );

      setSuccess("Company deleted successfully!");
    } catch (err) {
      console.error("Company delete error:", err);
      handleApiError(err, "Unable to delete company.");
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

        <div className="flex flex-wrap justify-between items-center gap-4 mt-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Company Management
            </h1>
            <p className="text-gray-500 mt-2">
              Add, update and manage recruiting companies.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 disabled:opacity-60"
          >
            <Plus size={18} />
            Add Company
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

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold text-red-600 mb-5">
              {editingId !== null ? "Edit Company" : "Add New Company"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["name", "Company Name", "text"],
                  ["industry", "Industry", "text"],
                  ["website", "Website", "url"],
                  ["location", "Location", "text"],
                ].map(([name, label, type]) => (
                  <div key={name}>
                    <label
                      htmlFor={name}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {label}
                    </label>

                    <input
                      id={name}
                      name={name}
                      type={type}
                      value={formData[name]}
                      onChange={handleChange}
                      required={name === "name" || name === "industry" || name === "location"}
                      maxLength={name === "name" || name === "location" ? 150 : name === "industry" ? 100 : undefined}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Company"
                    : "Save Company"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Company List */}
        <div className="bg-white border border-red-100 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Building2 size={20} className="text-red-600" />
            <h2 className="font-bold text-gray-900">
              Registered Companies ({companies.length})
            </h2>
          </div>

          {loading ? (
            <p className="p-6 text-gray-500">Loading companies...</p>
          ) : companies.length === 0 ? (
            <p className="p-6 text-gray-500">
              No companies added yet. Click Add Company to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-red-50 text-gray-700">
                  <tr>
                    <th className="p-4">Company</th>
                    <th className="p-4">Industry</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Website</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {companies.map((company) => (
                    <tr
                      key={company.id}
                      className="border-t border-gray-100"
                    >
                      <td className="p-4 font-semibold">
                        {company.name}
                      </td>

                      <td className="p-4">{company.industry}</td>

                      <td className="p-4">{company.location}</td>

                      <td className="p-4">
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:underline"
                          >
                            Visit Website
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(company)}
                            disabled={deletingId !== null}
                            className="flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(company)}
                            disabled={deletingId !== null}
                            className="flex items-center gap-1 text-red-600 hover:underline disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            {deletingId === company.id ? "Deleting..." : "Delete"}
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

export default CompanyManagement;
