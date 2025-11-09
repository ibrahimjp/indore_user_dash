import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./Reports.css";
import { apiClient, getErrorMessage } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const formatIssued = useCallback((timestamp) => {
    if (!timestamp) {
      return { date: "N/A", time: "N/A" };
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return { date: "N/A", time: "N/A" };
    }

    return {
      date: date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiClient.get("/api/reports");
      setReports(data?.reports || []);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const totalReports = useMemo(() => reports.length, [reports]);

  return (
    <div className="page-container">
      <div className="topbar">
        <h2>Welcome back, Emily 👋</h2>
        <div className="user">Profile</div>
      </div>

      <div className="reports-header">
        <h1>Case Reports</h1>
        <div className="total-reports">
          <h3>Total Reports</h3>
          <p className="count">{totalReports}</p>
        </div>
      </div>

      <hr className="divider" />

      {loading ? (
        <div className="reports-loading">Loading case reports…</div>
      ) : error ? (
        <div className="reports-error">
          <p>{error}</p>
          <button type="button" onClick={loadReports}>
            Retry
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="reports-empty">
          <h3>No reports yet</h3>
          <p>
            Complete a consultation and end the chat to generate your first
            AI-powered case report.
          </p>
        </div>
      ) : (
        <div className="reports-list">
          {reports.map((report) => {
            const issued = formatIssued(report.issuedAt);
            return (
              <button
                type="button"
                className="report-card"
                key={report.reportId}
                onClick={() => navigate(`/reports/${report.reportId}`)}
              >
                <div className="report-title">
                  <h2>{report.title}</h2>
                  <span className="report-session">
                    {report.sessionTitle || "SympAI consultation"}
                  </span>
                </div>
                <div className="report-details">
                  <div className="detail-item">
                    <h4>Issued Date</h4>
                    <p>{issued.date}</p>
                  </div>
                  <div className="detail-item">
                    <h4>Issued Time</h4>
                    <p>{issued.time}</p>
                  </div>
                  <div className="detail-item">
                    <h4>Report ID</h4>
                    <p>{report.reportId}</p>
                  </div>
                  <div className="report-tag">
                    <span>{report.aiGenerated ? "AI Generated" : "Clinician added"}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Reports;
