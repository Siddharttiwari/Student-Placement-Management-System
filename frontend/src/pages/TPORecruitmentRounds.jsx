
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ListChecks,
  Plus,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

import api, { initializeCSRF } from "../api/axios";

const emptyForm = {
  round_number: "",
  round_name: "",
  round_type: "APTITUDE",
  description: "",
  scheduled_date: "",
};

const roundTypes = [
  { value: "APTITUDE", label: "Aptitude Test" },
  { value: "CODING", label: "Coding Assessment" },
  { value: "TECHNICAL", label: "Technical Interview" },
  { value: "HR", label: "HR Interview" },
  { value: "GROUP_DISCUSSION", label: "Group Discussion" },
  { value: "OTHER", label: "Other" },
];

function TPORecruitmentRounds() {
  const { driveId } = useParams();
  const navigate = useNavigate();

  const [rounds, setRounds] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const endpoint = `placements/tpo/drives/${driveId}/rounds/`;

  const handleError = (err, fallback) => {
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

  useEffect(() => {
    let active = true;

    const fetchRounds = async () => {
      try {
        const response = await api.get(endpoint);

        if (!active) return;

        const data = response.data;

        setRounds(
          Array.isArray(data)
            ? data
            : data.results ?? []
        );
      } catch (err) {
        if (!active) return;
        handleError(err, "Unable to load recruitment rounds.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRounds();

    return () => {
      active = false;
    };
  }, [driveId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    const nextNumber =
      rounds.length > 0
        ? Math.max(...rounds.map((r) => Number(r.round_number))) + 1
        : 1;

    setFormData({
      ...emptyForm,
      round_number: String(nextNumber),
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();

      const payload = {
        round_number: Number(formData.round_number),
        round_name: formData.round_name.trim(),
        round_type: formData.round_type,
        description: formData.description.trim(),
        scheduled_date: formData.scheduled_date
          ? new Date(formData.scheduled_date).toISOString()
          : null,
      };

      const response = await api.post(endpoint, payload);

      setRounds((prev) =>
        [...prev, response.data].sort(
          (a, b) => a.round_number - b.round_number
        )
      );

      setSuccess("Recruitment round created successfully!");
      setShowForm(false);
      setFormData(emptyForm);
    } catch (err) {
      handleError(err, "Unable to create recruitment round.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-5xl mx-auto">

        <Link
          to="/tpo/drives"
          className="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Placement Drives
        </Link>

        <div className="flex flex-wrap justify-between items-center gap-4 mt-6 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <ListChecks size={30} className="text-red-600" />

              <h1 className="text-3xl font-bold text-gray-900">
                Recruitment Round Management
              </h1>
            </div>

            <p className="text-gray-500 mt-2">
              Placement Drive #{driveId} — Create and manage interview rounds.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            disabled={loading || saving}
            className="flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Plus size={18} />
            Add Round
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

        {showForm && (
          <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Add Recruitment Round
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label htmlFor="round_number" className="block text-sm font-medium mb-2">
                    Round Number
                  </label>
                  <input
                    id="round_number"
                    name="round_number"
                    type="number"
                    min="1"
                    required
                    value={formData.round_number}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3"
                  />
                </div>

                <div>
                  <label htmlFor="round_type" className="block text-sm font-medium mb-2">
                    Round Type
                  </label>
                  <select
                    id="round_type"
                    name="round_type"
                    value={formData.round_type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3"
                  >
                    {roundTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="round_name" className="block text-sm font-medium mb-2">
                    Round Name
                  </label>
                  <input
                    id="round_name"
                    name="round_name"
                    required
                    maxLength={150}
                    value={formData.round_name}
                    onChange={handleChange}
                    placeholder="Technical Interview"
                    className="w-full border border-gray-300 rounded-lg p-3"
                  />
                </div>

                <div>
                  <label htmlFor="scheduled_date" className="block text-sm font-medium mb-2">
                    Scheduled Date (Optional)
                  </label>
                  <input
                    id="scheduled_date"
                    name="scheduled_date"
                    type="datetime-local"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe this recruitment round..."
                  className="w-full border border-gray-300 rounded-lg p-3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create Round"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white border border-red-100 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold">
              Recruitment Rounds ({rounds.length})
            </h2>
          </div>

          {loading ? (
            <p className="p-6 text-gray-500">
              Loading recruitment rounds...
            </p>
          ) : rounds.length === 0 ? (
            <p className="p-6 text-gray-500">
              No recruitment rounds created yet. Click Add Round to begin.
            </p>
          ) : (
            <div className="p-5 space-y-4">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="border border-gray-200 rounded-xl p-5 hover:border-red-200"
                >
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-100 text-red-700 font-bold rounded-lg px-3 py-2">
                        {round.round_number}
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {round.round_name}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          {roundTypes.find(
                            (type) => type.value === round.round_type
                          )?.label ?? round.round_type}
                        </p>

                        {round.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {round.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <CheckCircle2 className="text-red-500" size={22} />
                  </div>

                  {round.scheduled_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
                      <CalendarDays size={16} />
                      {new Date(round.scheduled_date).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TPORecruitmentRounds;
