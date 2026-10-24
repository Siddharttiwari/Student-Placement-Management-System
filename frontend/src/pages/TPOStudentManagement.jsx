
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Ban,
  CheckCircle2,
  X,
  UserRound,
  LoaderCircle,
  Eye,
} from "lucide-react";

import api, { initializeCSRF } from "../api/axios";

// ==========================================
// FORM CONFIGURATION
// ==========================================

const emptyForm = {
  username: "",
  email: "",
  password: "",
  roll_number: "",
  full_name: "",
  course: "",
  branch: "",
  cgpa: "",
  graduation_year: "",
  phone_number: "",
};

const editableFields = [
  "full_name",
  "course",
  "branch",
  "cgpa",
  "graduation_year",
  "phone_number",
];

const endpoint = "students/tpo/students/";

function TPOStudentManagement() {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  const handleError = (err, fallback) => {
    const status = err.response?.status;

    if (status === 401) {
      navigate("/login", { replace: true });
      return;
    }

    if (status === 403) {
      setError(
        "Access denied. You do not have permission to manage students."
      );
      return;
    }

    const data = err.response?.data;

    if (data && typeof data === "object") {
      setError(
        Object.entries(data)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(", ")
              : String(value);

            return `${field}: ${message}`;
          })
          .join(" | ")
      );
    } else {
      setError(fallback);
    }
  };

  // ==========================================
  // LOAD STUDENTS
  // ==========================================

  const loadStudents = async () => {
    const response = await api.get(endpoint);

    const data = Array.isArray(response.data)
      ? response.data
      : response.data.results ?? [];

    setStudents(data);
  };

  useEffect(() => {
    let active = true;

    const fetchStudents = async () => {
      try {
        const response = await api.get(endpoint);

        if (!active) return;

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results ?? [];

        setStudents(data);
      } catch (err) {
        if (active) {
          handleError(err, "Unable to load students.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      active = false;
    };
  }, [navigate]);

  // ==========================================
  // OPEN ADD STUDENT FORM
  // ==========================================

  const openAdd = () => {
    setForm({ ...emptyForm });
    setModal({ type: "ADD" });
    setError("");
    setSuccess("");
  };

  // ==========================================
  // OPEN EDIT STUDENT FORM
  // ==========================================

  const openEdit = (student) => {
    setForm({
      ...emptyForm,
      full_name: student.full_name ?? "",
      course: student.course ?? "",
      branch: student.branch ?? "",
      cgpa: student.cgpa ?? "",
      graduation_year: student.graduation_year ?? "",
      phone_number: student.phone_number ?? "",
    });

    setModal({
      type: "EDIT",
      student,
    });

    setError("");
    setSuccess("");
  };

  // ==========================================
  // UPDATE FORM FIELD
  // ==========================================

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================
  // ADD / EDIT STUDENT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || !modal) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();

      if (modal.type === "ADD") {
        await api.post(endpoint, form);

        setSuccess("Student added successfully.");
      } else if (modal.type === "EDIT") {
        const payload = {};

        editableFields.forEach((field) => {
          payload[field] = form[field];
        });

        await api.patch(
          `${endpoint}${modal.student.id}/`,
          payload
        );

        setSuccess("Student profile updated successfully.");
      }

      await loadStudents();

      setModal(null);
      setForm({ ...emptyForm });
    } catch (err) {
      handleError(err, "Unable to save student.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // BLOCK / UNBLOCK STUDENT
  // ==========================================

  const toggleStudentStatus = async (student) => {
    if (busyId !== null) return;

    const action = student.is_active
      ? "block"
      : "unblock";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${student.full_name}?`
    );

    if (!confirmed) return;

    setBusyId(student.id);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();

      await api.patch(
        `${endpoint}${student.id}/${action}/`,
        {}
      );

      await loadStudents();

      setSuccess(
        action === "block"
          ? "Student blocked successfully."
          : "Student unblocked successfully."
      );
    } catch (err) {
      handleError(
        err,
        `Unable to ${action} student.`
      );
    } finally {
      setBusyId(null);
    }
  };

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const filteredStudents = students.filter((student) => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      student.full_name,
      student.roll_number,
      student.username,
      student.email,
      student.course,
      student.branch,
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(query)
    );

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && student.is_active) ||
      (statusFilter === "BLOCKED" && !student.is_active);

    return matchesSearch && matchesStatus;
  });

  const activeCount = students.filter(
    (student) => student.is_active
  ).length;

  const blockedCount = students.length - activeCount;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* BACK NAVIGATION */}

        <Link
          to="/tpo/dashboard"
          className="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline"
        >
          <ArrowLeft size={18} />
          Back to TPO Dashboard
        </Link>

        {/* PAGE HEADER */}

        <div className="flex flex-wrap justify-between items-center gap-4 mt-7 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Student Management
            </h1>

            <p className="text-gray-500 mt-2">
              Manage registered students, profiles and portal access.
            </p>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            <Plus size={19} />
            Add Student
          </button>
        </div>

        {/* STATISTICS CARDS */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Total Students",
              value: students.length,
            },
            {
              label: "Active Students",
              value: activeCount,
            },
            {
              label: "Blocked Students",
              value: blockedCount,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white border border-red-100 rounded-xl p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">
                {item.label}
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? "..." : item.value}
              </p>
            </div>
          ))}
        </div>

        {/* SUCCESS MESSAGE */}

        {success && (
          <p
            role="status"
            className="bg-green-100 text-green-700 p-4 rounded-lg mb-5"
          >
            {success}
          </p>
        )}

        {/* ERROR MESSAGE */}

        {error && !modal && (
          <p
            role="alert"
            className="bg-red-100 text-red-700 p-4 rounded-lg mb-5"
          >
            {error}
          </p>
        )}

        {/* STUDENTS TABLE */}

        <div className="bg-white border border-red-100 rounded-xl shadow-sm p-5">

          {/* SEARCH AND FILTER */}

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 flex-1 min-w-52">
              <Search
                size={18}
                className="text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search name, roll number, course..."
                className="w-full py-3 outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="border border-gray-300 rounded-lg px-4 py-3"
            >
              <option value="ALL">
                All Students
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="BLOCKED">
                Blocked
              </option>
            </select>
          </div>

          {/* TABLE CONTENT */}

          {loading ? (
            <div className="flex items-center gap-2 text-gray-600 p-4">
              <LoaderCircle
                size={20}
                className="animate-spin"
              />
              Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-gray-500 p-4">
              No students found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">

                <thead className="bg-red-50 text-gray-700">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Course / Branch</th>
                    <th className="p-4">CGPA</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >

                      {/* STUDENT INFO */}

                      <td className="p-4">
                        <p className="font-semibold text-gray-900">
                          {student.full_name}
                        </p>

                        <p className="text-gray-500">
                          {student.roll_number}
                        </p>

                        <p className="text-xs text-gray-400">
                          {student.email}
                        </p>
                      </td>

                      {/* COURSE / BRANCH */}

                      <td className="p-4">
                        <p className="font-medium">
                          {student.course}
                        </p>

                        <p className="text-gray-500">
                          {student.branch}
                        </p>
                      </td>

                      {/* CGPA */}

                      <td className="p-4 font-semibold">
                        {student.cgpa}
                      </td>

                      {/* ACCOUNT STATUS */}

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            student.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {student.is_active
                            ? "Active"
                            : "Blocked"}
                        </span>
                      </td>

                      {/* ACTION BUTTONS */}

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">

                          {/* VIEW DETAILS */}

                          <Link
                            to={`/tpo/students/${student.id}`}
                            className="inline-flex items-center gap-1 bg-red-50 text-red-600 rounded-lg px-3 py-2 font-medium hover:bg-red-100"
                          >
                            <Eye size={15} />
                            View Details
                          </Link>

                          {/* EDIT STUDENT */}

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(student)
                            }
                            className="inline-flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-100"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          {/* BLOCK / UNBLOCK */}

                          <button
                            type="button"
                            onClick={() =>
                              toggleStudentStatus(student)
                            }
                            disabled={busyId !== null}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 font-medium disabled:opacity-50 ${
                              student.is_active
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {student.is_active ? (
                              <Ban size={15} />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}

                            {busyId === student.id
                              ? "Updating..."
                              : student.is_active
                              ? "Block"
                              : "Unblock"}
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

        {/* ADD / EDIT STUDENT MODAL */}

        {modal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">

              {/* MODAL HEADER */}

              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <UserRound
                    size={22}
                    className="text-red-600"
                  />

                  <h2 className="text-xl font-bold">
                    {modal.type === "ADD"
                      ? "Add Student"
                      : "Edit Student"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    setError("");
                  }}
                  disabled={saving}
                  aria-label="Close form"
                  className="text-gray-500 hover:text-red-600"
                >
                  <X size={22} />
                </button>
              </div>

              {/* MODAL ERROR */}

              {error && (
                <p
                  role="alert"
                  className="bg-red-100 text-red-700 p-3 rounded-lg mb-4"
                >
                  {error}
                </p>
              )}

              {/* STUDENT FORM */}

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {(modal.type === "ADD"
                  ? [
                      "username",
                      "email",
                      "password",
                      "roll_number",
                      ...editableFields,
                    ]
                  : editableFields
                ).map((field) => (
                  <div key={field}>
                    <label
                      htmlFor={`student-${field}`}
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      {field
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, (c) =>
                          c.toUpperCase()
                        )}
                    </label>

                    <input
                      id={`student-${field}`}
                      type={
                        field === "password"
                          ? "password"
                          : field === "email"
                          ? "email"
                          : [
                              "cgpa",
                              "graduation_year",
                            ].includes(field)
                          ? "number"
                          : "text"
                      }
                      min={
                        field === "cgpa"
                          ? "0"
                          : field === "graduation_year"
                          ? "2000"
                          : undefined
                      }
                      max={
                        field === "cgpa"
                          ? "10"
                          : undefined
                      }
                      step={
                        field === "cgpa"
                          ? "0.01"
                          : undefined
                      }
                      required
                      value={form[field]}
                      onChange={(event) =>
                        updateForm(
                          field,
                          event.target.value
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                ))}

                {/* FORM ACTIONS */}

                <div className="sm:col-span-2 flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setModal(null);
                      setError("");
                    }}
                    disabled={saving}
                    className="border border-gray-300 rounded-lg px-5 py-2 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-red-600 text-white rounded-lg px-5 py-2 font-semibold hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : modal.type === "ADD"
                      ? "Create Student"
                      : "Save Changes"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default TPOStudentManagement;
