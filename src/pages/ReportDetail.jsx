import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Reports.css";
import { apiClient, getErrorMessage } from "../utils/api";
import CaseReportView from "../components/CaseReportView";
import { toast } from "react-toastify";

const ReportDetail = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [session, setSession] = useState(null);

  const loadReport = useCallback(async () => {
    if (!reportId) {
      setError("Missing report id.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data } = await apiClient.get(`/api/reports/${reportId}`);
      setReport(data?.report || null);
      setSession(data?.report?.session || null);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="topbar">
          <h2>Case Report</h2>
        </div>
        <div className="reports-loading">Loading report…</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="page-container">
        <div className="topbar">
          <h2>Case Report</h2>
        </div>
        <div className="reports-error">
          <p>{error || "Report not found."}</p>
          <button type="button" onClick={() => navigate("/reports")}>
            Back to reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="topbar">
        <h2>Case Report</h2>
        <div className="user">Profile</div>
      </div>
      <CaseReportView
        variant="page"
        report={report}
        session={session}
        onBack={() => navigate(-1)}
      />
    </div>
  );
};

export default ReportDetail;


