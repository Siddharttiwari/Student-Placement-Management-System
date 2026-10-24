
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  Trophy,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import api from "../api/axios";

const resultStyles = {
  QUALIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  NOT_STARTED: "bg-gray-100 text-gray-600",
};

function StudentRecruitmentProgress() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchProgress = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `placements/student/applications/${applicationId}/rounds/`
        );

        if (active) {
          setApplication(response.data);
        }
      } catch (err) {
        if (!active) return;

        if ([401, 403].includes(err.response?.status)) {
          navigate("/login", { replace: true });
          return;
        }

        setError("Unable to load recruitment progress.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProgress();

    return () => {
      active = false;
    };
  }, [applicationId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 p-8 flex items-center gap-3">
        <LoaderCircle className="animate-spin text-red-600" />
        Loading recruitment progress...
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <p className="text-red-600">
          {error || "Application not found."}
        </p>
        <Link
          to="/student/applications"
          className="text-red-600 underline mt-4 inline-block"
        >
          Back to My Applications
        </Link>
      </div>
    );
  }

  const rounds = application.rounds ?? [];

  const qualifiedCount = rounds.filter(
    (round) => round.result === "QUALIFIED"
  ).length;

  const progress =
    rounds.length > 0
      ? (qualifiedCount / rounds.length) * 100
      : 0;

  const isSelected = application.status === "SELECTED";
  const isRejected = application.status === "REJECTED";

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/student/applications"
          className="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline"
        >
          <ArrowLeft size={18} />
          Back to My Applications
        </Link>

        {/* APPLICATION HEADER */}

        <div className="bg-white border border-red-100 rounded-xl shadow-sm p-6 mt-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Recruitment Progress
          </h1>

          <p className="text-gray-500 mt-2">
            Application #{application.application_id}
          </p>

          <div className="mt-5">
            <h2 className="text-xl font-semibold">
              {application.job_title}
            </h2>

            <p className="text-gray-600">
              {application.company_name}
            </p>
          </div>

          <div className="mt-5">
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                isSelected
                  ? "bg-green-100 text-green-700"
                  : isRejected
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {application.status.replaceAll("_", " ")}
            </span>
          </div>
        </div>

        {/* PROGRESS BAR */}

        {rounds.length > 0 && (
          <div className="bg-white border border-red-100 rounded-xl shadow-sm p-6 mt-6">
            <div className="flex justify-between items-center gap-3">
              <h2 className="text-lg font-bold">
                Recruitment Rounds
              </h2>

              <span className="text-sm font-semibold text-gray-600">
                {qualifiedCount} / {rounds.length} Qualified
              </span>
            </div>

            <div className="w-full h-3 bg-gray-200 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ROUND TIMELINE */}

        <div className="space-y-4 mt-6">
          {rounds.length === 0 ? (
            <div className="bg-white border border-red-100 rounded-xl p-6 text-gray-600">
              Recruitment rounds have not been announced yet.
            </div>
          ) : (
            rounds.map((round) => (
              <div
                key={round.round_id}
                className="bg-white border border-red-100 rounded-xl shadow-sm p-5"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-sm font-semibold text-red-600">
                      Round {round.round_number}
                    </p>

                    <h3 className="text-lg font-bold mt-1">
                      {round.round_name}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {round.round_type.replaceAll("_", " ")}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-2 rounded-full text-xs font-semibold ${
                      resultStyles[round.result] ??
                      resultStyles.NOT_STARTED
                    }`}
                  >
                    {round.result.replaceAll("_", " ")}
                  </span>
                </div>

                {round.scheduled_date && (
                  <p className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                    <Clock3 size={16} className="text-red-600" />
                    {new Date(
                      round.scheduled_date
                    ).toLocaleString("en-IN")}
                  </p>
                )}

                {round.result === "QUALIFIED" && (
                  <p className="flex items-center gap-2 text-green-700 text-sm mt-4">
                    <CheckCircle2 size={17} />
                    You have qualified this round.
                  </p>
                )}

                {round.result === "REJECTED" && (
                  <p className="flex items-center gap-2 text-red-700 text-sm mt-4">
                    <XCircle size={17} />
                    You did not qualify this round.
                  </p>
                )}

                {round.result === "NOT_STARTED" && (
                  <p className="flex items-center gap-2 text-gray-500 text-sm mt-4">
                    <LockKeyhole size={17} />
                    Result not announced yet.
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* FINAL RESULT */}

        {isSelected && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6">
            <div className="flex items-center gap-3">
              <Trophy size={28} className="text-green-600" />

              <div>
                <h2 className="text-xl font-bold text-green-800">
                  Congratulations! You are selected.
                </h2>

                <p className="text-sm text-green-700 mt-1">
                  You have successfully completed the
                  recruitment process.
                </p>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-6">
            <h2 className="font-bold text-red-800">
              Application Not Selected
            </h2>

            <p className="text-sm text-red-700 mt-2">
              Your application has been marked as rejected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentRecruitmentProgress;
