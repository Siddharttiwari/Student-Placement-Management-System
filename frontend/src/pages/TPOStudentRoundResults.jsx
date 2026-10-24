
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  Trophy,
} from "lucide-react";

import api, { initializeCSRF } from "../api/axios";

const resultStyles = {
  QUALIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
  NOT_STARTED: "bg-gray-100 text-gray-600",
};

const resultLabels = {
  QUALIFIED: "Qualified",
  REJECTED: "Rejected",
  PENDING: "Pending",
  NOT_STARTED: "Not Started",
};

function TPOStudentRoundResults() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  const [updatingRoundId, setUpdatingRoundId] = useState(null);
  const [selecting, setSelecting] = useState(false);

  const [remarks, setRemarks] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const endpoint =
    `placements/tpo/applications/${applicationId}/round-results/`;

  const statusEndpoint =
    `placements/tpo/applications/${applicationId}/status/`;

  const loadResults = async () => {
    const response = await api.get(endpoint);
    setApplication(response.data);
    return response.data;
  };

  useEffect(() => {
    let active = true;

    const fetchResults = async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      setApplication(null);

      try {
        const response = await api.get(endpoint);

        if (!active) return;

        setApplication(response.data);
      } catch (err) {
        if (!active) return;

        if ([401, 403].includes(err.response?.status)) {
          navigate("/login", { replace: true });
          return;
        }

        setError("Unable to load recruitment results.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      active = false;
    };
  }, [endpoint, navigate]);

  // ---------------------------------------
  // UPDATE RECRUITMENT ROUND RESULT
  // ---------------------------------------

  const updateResult = async (roundId, result) => {
    if (updatingRoundId !== null || selecting) return;

    setUpdatingRoundId(roundId);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();

      await api.patch(endpoint, {
        round: roundId,
        result,
        remarks: remarks[roundId] ?? "",
      });

      await loadResults();

      setSuccess(
        `Round result updated to ${resultLabels[result]}.`
      );
    } catch (err) {
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
        setError("Unable to update recruitment result.");
      }
    } finally {
      setUpdatingRoundId(null);
    }
  };

  // ---------------------------------------
  // APPLICATION STATUS AND ROUND CHECKS
  // ---------------------------------------

  const isFinalized =
    application?.status === "SELECTED" ||
    application?.status === "REJECTED";

  const canManage =
    application?.status === "SHORTLISTED" ||
    application?.status === "IN_PROGRESS";

  const rounds = application?.rounds ?? [];

  const qualifiedRounds = rounds.filter(
    (round) => round.result === "QUALIFIED"
  ).length;

  const allRoundsQualified =
    rounds.length > 0 &&
    rounds.every((round) => round.result === "QUALIFIED");

  const canFinalizeSelection =
    canManage && allRoundsQualified;

  const canUpdateRound = (round, index) => {
    if (!canManage) return false;

    if (
      round.result !== "NOT_STARTED" &&
      round.result !== "PENDING"
    ) {
      return false;
    }

    return rounds
      .slice(0, index)
      .every((previous) => previous.result === "QUALIFIED");
  };

  // ---------------------------------------
  // FINAL STUDENT SELECTION
  // ---------------------------------------

  const handleFinalSelection = async () => {
    if (
      !canFinalizeSelection ||
      selecting ||
      updatingRoundId !== null
    ) {
      return;
    }

    const confirmed = window.confirm(
      `All ${rounds.length} recruitment rounds are qualified.\n\n` +
      `Mark ${application.student_name} as SELECTED for ` +
      `${application.job_title}?`
    );

    if (!confirmed) return;

    setSelecting(true);
    setError("");
    setSuccess("");

    try {
      await initializeCSRF();

      await api.patch(statusEndpoint, {
        status: "SELECTED",
      });

      await loadResults();

      setSuccess(
        "Student successfully selected after completing all recruitment rounds!"
      );
    } catch (err) {
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
        setError("Unable to finalize student selection.");
      }
    } finally {
      setSelecting(false);
    }
  };

  // ---------------------------------------
  // LOADING SCREEN
  // ---------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="flex items-center gap-3 text-gray-600">
          <LoaderCircle
            size={22}
            className="animate-spin text-red-600"
          />
          Loading recruitment results...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* BACK NAVIGATION */}

        <Link
          to="/tpo/applications"
          className="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Student Applications
        </Link>

        {/* APPLICATION HEADER */}

        <div className="bg-white border border-red-100 rounded-xl shadow-sm p-6 mt-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-600">
                <ListChecks size={24} />

                <h1 className="text-2xl font-bold text-gray-900">
                  Student Recruitment Results
                </h1>
              </div>

              <p className="text-gray-500 mt-2">
                Application #{applicationId}
              </p>
            </div>

            {application && (
              <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                {application.status.replaceAll("_", " ")}
              </span>
            )}
          </div>

          {application && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 border-t border-gray-100 pt-5">
              <div>
                <p className="text-sm text-gray-500">
                  Student
                </p>

                <p className="font-semibold">
                  {application.student_name}
                </p>

                <p className="text-sm text-gray-500">
                  {application.roll_number}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Company / Job
                </p>

                <p className="font-semibold">
                  {application.company_name}
                </p>

                <p className="text-sm text-gray-600">
                  {application.job_title}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <p
            role="alert"
            className="bg-red-100 text-red-700 p-4 rounded-lg mb-5"
          >
            {error}
          </p>
        )}

        {/* SUCCESS MESSAGE */}

        {success && (
          <p
            role="status"
            className="bg-green-100 text-green-700 p-4 rounded-lg mb-5"
          >
            {success}
          </p>
        )}

        {/* FINALIZED MESSAGE */}

        {isFinalized && (
          <div className="flex items-center gap-3 bg-white border border-red-100 rounded-lg p-4 mb-6">
            <LockKeyhole
              size={20}
              className="text-red-600"
            />

            <p className="text-sm text-gray-600">
              This application is finalized. Recruitment
              results are available in read-only mode.
            </p>
          </div>
        )}

        {/* RECRUITMENT PROGRESS */}

        {application && rounds.length > 0 && (
          <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm mb-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                Recruitment Progress
              </h2>

              <span className="text-sm font-semibold text-gray-600">
                {qualifiedRounds} / {rounds.length} Qualified
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (qualifiedRounds / rounds.length) * 100
                  }%`,
                }}
              />
            </div>

            <p className="text-sm text-gray-500 mt-3">
              {allRoundsQualified
                ? "All recruitment rounds have been successfully qualified."
                : "Complete the remaining recruitment rounds to unlock final selection."}
            </p>
          </div>
        )}

        {/* RECRUITMENT ROUNDS */}

        {!application ? (
          <div className="bg-white rounded-xl p-6 text-gray-500">
            No application details available.
          </div>
        ) : rounds.length === 0 ? (
          <div className="bg-white border border-red-100 rounded-xl p-6">
            <p className="text-gray-600">
              No recruitment rounds have been configured
              for this placement drive.
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {rounds.map((round, index) => {
              const editable = canUpdateRound(round, index);

              const isUpdating =
                updatingRoundId === round.round_id;

              return (
                <div
                  key={round.round_id}
                  className="bg-white border border-red-100 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <p className="text-sm font-semibold text-red-600">
                        Round {round.round_number}
                      </p>

                      <h2 className="text-xl font-bold text-gray-900 mt-1">
                        {round.round_name}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        {round.round_type.replaceAll("_", " ")}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-2 rounded-full text-xs font-semibold ${
                        resultStyles[round.result] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {resultLabels[round.result] ??
                        round.result}
                    </span>
                  </div>

                  {/* ROUND DESCRIPTION */}

                  {round.description && (
                    <p className="text-gray-600 text-sm mt-4">
                      {round.description}
                    </p>
                  )}

                  {/* SCHEDULED DATE */}

                  {round.scheduled_date && (
                    <p className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                      <Clock3
                        size={16}
                        className="text-red-600"
                      />

                      Scheduled:{" "}
                      {new Date(
                        round.scheduled_date
                      ).toLocaleString("en-IN")}
                    </p>
                  )}

                  {/* SAVED REMARKS */}

                  {round.remarks && (
                    <p className="text-sm text-gray-600 mt-4">
                      <span className="font-semibold">
                        Remarks:
                      </span>{" "}
                      {round.remarks}
                    </p>
                  )}

                  {/* ROUND UPDATE FORM */}

                  {editable ? (
                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <label
                        htmlFor={`remarks-${round.round_id}`}
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        TPO Remarks (optional)
                      </label>

                      <textarea
                        id={`remarks-${round.round_id}`}
                        rows={2}
                        value={
                          remarks[round.round_id] ?? ""
                        }
                        onChange={(event) =>
                          setRemarks((prev) => ({
                            ...prev,
                            [round.round_id]:
                              event.target.value,
                          }))
                        }
                        placeholder="Enter feedback about this round..."
                        disabled={
                          updatingRoundId !== null ||
                          selecting
                        }
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      />

                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          type="button"
                          disabled={
                            updatingRoundId !== null ||
                            selecting
                          }
                          onClick={() =>
                            updateResult(
                              round.round_id,
                              "QUALIFIED"
                            )
                          }
                          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? (
                            <LoaderCircle
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <CheckCircle2 size={17} />
                          )}

                          Mark Qualified
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingRoundId !== null ||
                            selecting
                          }
                          onClick={() =>
                            updateResult(
                              round.round_id,
                              "REJECTED"
                            )
                          }
                          className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle size={17} />
                          Mark Rejected
                        </button>
                      </div>
                    </div>
                  ) : (
                    !isFinalized &&
                    round.result !== "QUALIFIED" &&
                    round.result !== "REJECTED" && (
                      <p className="text-sm text-gray-500 mt-5">
                        Complete all previous rounds before
                        processing this round.
                      </p>
                    )
                  )}
                </div>
              );
            })}

            {/* FINAL RECRUITMENT DECISION */}

            {!isFinalized && (
              <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm mt-6">
                <div className="flex items-center gap-3">
                  <Trophy
                    size={25}
                    className={
                      allRoundsQualified
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  />

                  <h2 className="text-xl font-bold text-gray-900">
                    Final Recruitment Decision
                  </h2>
                </div>

                <p className="text-sm text-gray-600 mt-3">
                  {allRoundsQualified
                    ? "The student has qualified all recruitment rounds and is eligible for final selection."
                    : "The student must qualify every recruitment round before final selection can be completed."}
                </p>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleFinalSelection}
                    disabled={
                      !canFinalizeSelection ||
                      selecting ||
                      updatingRoundId !== null
                    }
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selecting ? (
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Trophy size={18} />
                    )}

                    {selecting
                      ? "Finalizing Selection..."
                      : "Mark Selected"}
                  </button>
                </div>

                {!allRoundsQualified && (
                  <p className="text-xs text-gray-500 mt-3">
                    This button will become available after
                    all rounds are qualified.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TPOStudentRoundResults;
