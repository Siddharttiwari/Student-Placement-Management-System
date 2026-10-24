
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  UserRound,
  GraduationCap,
  BriefcaseBusiness,
  FileText,
  Clock3,
  Trophy,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";

import api from "../api/axios";

// ==========================================
// APPLICATION STATUS STYLES
// ==========================================

const applicationStatusStyles = {
  APPLIED: "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  SELECTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

// ==========================================
// RECRUITMENT ROUND RESULT STYLES
// ==========================================

const roundResultStyles = {
  QUALIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
  NOT_STARTED: "bg-gray-100 text-gray-600",
};

const formatLabel = (value) =>
  String(value ?? "").replaceAll("_", " ");

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ==========================================
// EXTRACT FILENAME FROM RESPONSE HEADER
// ==========================================

const getDownloadFilename = (headers, studentId) => {
  const disposition = headers?.["content-disposition"] ?? "";

  const utf8Match = disposition.match(
    /filename\*=UTF-8''([^;]+)/i
  );

  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      // Fall back to the standard filename.
    }
  }

  const filenameMatch = disposition.match(
    /filename="?([^";]+)"?/i
  );

  if (filenameMatch) {
    return filenameMatch[1].trim();
  }

  return `student_${studentId}_resume.pdf`;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

function TPOStudentDetails() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const [downloading, setDownloading] = useState(false);

  const [error, setError] = useState("");
  const [resumeError, setResumeError] = useState("");

  const [expandedApplications, setExpandedApplications] =
    useState({});

  // ==========================================
  // FETCH STUDENT DETAILS
  // ==========================================

  useEffect(() => {
    let active = true;

    const fetchDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `students/tpo/students/${studentId}/full-details/`
        );

        if (!active) return;

        setDetails(response.data);
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        if (err.response?.status === 403) {
          setError(
            "Access denied. Only authorized TPO users can view student details."
          );
          return;
        }

        setError(
          err.response?.status === 404
            ? "Student not found."
            : "Unable to load student details."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      active = false;
    };
  }, [studentId, navigate]);

  // ==========================================
  // SECURE RESUME DOWNLOAD
  // ==========================================

  const downloadResume = async () => {
    if (downloading) return;

    setDownloading(true);
    setResumeError("");

    let blobUrl = null;

    try {
      const response = await api.get(
        `students/resumes/${studentId}/`,
        {
          responseType: "blob",
        }
      );

      const contentType =
        response.headers["content-type"] ||
        "application/octet-stream";

      const blob = new Blob(
        [response.data],
        { type: contentType }
      );

      blobUrl = window.URL.createObjectURL(blob);

      const filename = getDownloadFilename(
        response.headers,
        studentId
      );

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Resume download error:", err);

      const status = err.response?.status;

      if (status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      if (status === 403) {
        setResumeError(
          "You do not have permission to download this resume."
        );
      } else if (status === 404) {
        setResumeError(
          "Resume file was not found on the server."
        );
      } else {
        setResumeError(
          "Unable to download resume. Please try again."
        );
      }
    } finally {
      if (blobUrl) {
        window.setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 1000);
      }

      setDownloading(false);
    }
  };

  // ==========================================
  // EXPAND / COLLAPSE APPLICATION
  // ==========================================

  const toggleApplication = (applicationId) => {
    setExpandedApplications((previous) => ({
      ...previous,
      [applicationId]: !previous[applicationId],
    }));
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center gap-3">
        <LoaderCircle
          size={24}
          className="animate-spin text-red-600"
        />

        <p className="text-gray-600">
          Loading student details...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR / NO DATA
  // ==========================================

  if (error || !details) {
    return (
      <div className="min-h-screen bg-red-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Link
            to="/tpo/students"
            className="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline"
          >
            <ArrowLeft size={18} />
            Back to Student Management
          </Link>

          <p
            role="alert"
            className="bg-red-100 text-red-700 p-4 rounded-lg mt-6"
          >
            {error || "Student details are unavailable."}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // STUDENT DATA
  // ==========================================

  const student = details.student;
  const applications = details.applications ?? [];

  const isPlaced =
    details.placement_status === "PLACED";

  const profileFields = [
    ["Roll Number", student.roll_number],
    ["Username", student.username],
    ["Email", student.email],
    ["Course", student.course],
    ["Branch", student.branch],
    ["CGPA", student.cgpa],
    ["Graduation Year", student.graduation_year],
    ["Phone Number", student.phone_number],
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* BACK NAVIGATION */}

        <Link
          to="/tpo/students"
          className="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Student Management
        </Link>

        {/* ======================================
            STUDENT HEADER
        ====================================== */}

        <div className="bg-white border border-red-100 rounded-xl shadow-sm p-6 mt-6">

          <div className="flex flex-wrap justify-between items-start gap-4">

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                <UserRound
                  size={28}
                  className="text-red-600"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {student.full_name}
                </h1>

                <p className="text-gray-500 mt-1">
                  {student.roll_number}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`px-3 py-2 rounded-full text-xs font-semibold ${
                  student.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {student.is_active
                  ? "Active Account"
                  : "Blocked Account"}
              </span>

              <span
                className={`px-3 py-2 rounded-full text-xs font-semibold ${
                  isPlaced
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {isPlaced ? "Placed" : "Unplaced"}
              </span>
            </div>

          </div>
        </div>

        {/* ======================================
            PLACEMENT STATISTICS
        ====================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">

          {[
            {
              label: "Total Applications",
              value: details.total_applications,
              icon: BriefcaseBusiness,
            },
            {
              label: "Total Selections",
              value: details.total_selections,
              icon: Trophy,
            },
            {
              label: "Placement Status",
              value: details.placement_status,
              icon: GraduationCap,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="bg-white border border-red-100 rounded-xl p-5 shadow-sm"
              >
                <Icon
                  size={22}
                  className="text-red-600"
                />

                <p className="text-sm text-gray-500 mt-3">
                  {item.label}
                </p>

                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {item.value}
                </p>
              </div>
            );
          })}

        </div>

        {/* ======================================
            STUDENT PROFILE
        ====================================== */}

        <div className="bg-white border border-red-100 rounded-xl shadow-sm p-6 mt-6">

          <div className="flex items-center gap-2 mb-5">
            <GraduationCap
              size={22}
              className="text-red-600"
            />

            <h2 className="text-xl font-bold text-gray-900">
              Student Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {profileFields.map(([label, value]) => (
              <div key={label}>
                <p className="text-sm text-gray-500">
                  {label}
                </p>

                <p className="font-semibold text-gray-900 mt-1 break-words">
                  {value === null ||
                  value === undefined ||
                  value === ""
                    ? "Not provided"
                    : value}
                </p>
              </div>
            ))}
          </div>

          {/* ======================================
              SECURE RESUME DOWNLOAD
          ====================================== */}

          <div className="border-t border-gray-100 mt-6 pt-5">

            <h3 className="font-semibold text-gray-900 mb-3">
              Student Resume
            </h3>

            {resumeError && (
              <p
                role="alert"
                className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm"
              >
                {resumeError}
              </p>
            )}

            {student.resume ? (
              <div>
                <button
                  type="button"
                  onClick={downloadResume}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {downloading ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Download size={17} />
                  )}

                  {downloading
                    ? "Downloading..."
                    : "Download Resume"}
                </button>

                <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                  <FileText size={14} />
                  Resume is downloaded through an authenticated API.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No resume uploaded.
              </p>
            )}

          </div>
        </div>

        {/* ======================================
            APPLICATION HISTORY
        ====================================== */}

        <div className="mt-6">

          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Application & Recruitment History
          </h2>

          {applications.length === 0 ? (
            <div className="bg-white border border-red-100 rounded-xl p-6 text-gray-500">
              This student has not applied for any placement drives.
            </div>
          ) : (
            <div className="space-y-4">

              {applications.map((application) => {
                const expanded =
                  expandedApplications[application.id] ?? false;

                const rounds = application.rounds ?? [];

                const qualifiedCount = rounds.filter(
                  (round) =>
                    round.result === "QUALIFIED"
                ).length;

                return (
                  <div
                    key={application.id}
                    className="bg-white border border-red-100 rounded-xl shadow-sm overflow-hidden"
                  >

                    {/* APPLICATION INFORMATION */}

                    <div className="p-6">

                      <div className="flex flex-wrap justify-between gap-4">

                        <div>
                          <p className="text-red-600 font-semibold">
                            {application.company_name}
                          </p>

                          <h3 className="text-lg font-bold text-gray-900 mt-1">
                            {application.job_title}
                          </h3>

                          <p className="text-sm text-gray-500 mt-2">
                            {application.job_location}
                            {" · "}
                            ₹{application.package_lpa} LPA
                          </p>

                          <p className="text-sm text-gray-500 mt-2">
                            Applied:{" "}
                            {formatDate(
                              application.applied_at
                            )}
                          </p>
                        </div>

                        <span
                          className={`self-start px-3 py-2 rounded-full text-xs font-semibold ${
                            applicationStatusStyles[
                              application.status
                            ] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {formatLabel(
                            application.status
                          )}
                        </span>

                      </div>

                      {/* RECRUITMENT PROGRESS */}

                      <div className="flex flex-wrap justify-between items-center gap-3 mt-5 pt-4 border-t border-gray-100">

                        <p className="text-sm text-gray-600">
                          Recruitment Progress:{" "}
                          <span className="font-semibold">
                            {rounds.length === 0
                              ? "No rounds configured"
                              : `${qualifiedCount} / ${rounds.length} Qualified`}
                          </span>
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            toggleApplication(
                              application.id
                            )
                          }
                          aria-expanded={expanded}
                          className="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline"
                        >
                          {expanded
                            ? "Hide Rounds"
                            : "View Rounds"}

                          {expanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>

                      </div>
                    </div>

                    {/* EXPANDED RECRUITMENT ROUNDS */}

                    {expanded && (
                      <div className="bg-red-50/60 border-t border-red-100 p-6">

                        {rounds.length === 0 ? (
                          <p className="text-gray-500 text-sm">
                            No recruitment rounds configured for this drive.
                          </p>
                        ) : (
                          <div className="space-y-3">

                            {rounds.map((round) => (
                              <div
                                key={round.round_id}
                                className="bg-white border border-red-100 rounded-lg p-4"
                              >

                                <div className="flex flex-wrap justify-between gap-3">

                                  <div>
                                    <p className="text-xs font-semibold text-red-600">
                                      Round{" "}
                                      {round.round_number}
                                    </p>

                                    <h4 className="font-semibold text-gray-900 mt-1">
                                      {round.round_name}
                                    </h4>

                                    <p className="text-xs text-gray-500 mt-1">
                                      {formatLabel(
                                        round.round_type
                                      )}
                                    </p>
                                  </div>

                                  <span
                                    className={`self-start px-3 py-1 rounded-full text-xs font-semibold ${
                                      roundResultStyles[
                                        round.result
                                      ] ??
                                      "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {formatLabel(
                                      round.result
                                    )}
                                  </span>

                                </div>

                                {/* ROUND SCHEDULE */}

                                {round.scheduled_date && (
                                  <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                                    <Clock3 size={15} />

                                    Scheduled:{" "}
                                    {formatDate(
                                      round.scheduled_date
                                    )}
                                  </p>
                                )}

                                {/* ROUND REMARKS */}

                                {round.remarks && (
                                  <p className="text-sm text-gray-600 mt-3">
                                    <span className="font-semibold">
                                      Remarks:
                                    </span>{" "}
                                    {round.remarks}
                                  </p>
                                )}

                              </div>
                            ))}

                          </div>
                        )}

                        {/* VIEW RECRUITMENT RECORD */}

                        <Link
                          to={`/tpo/applications/${application.id}/rounds`}
                          className="inline-flex items-center gap-2 text-red-600 font-semibold text-sm mt-5 hover:underline"
                        >
                          View Recruitment Record
                          <ExternalLink size={15} />
                        </Link>

                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default TPOStudentDetails;
