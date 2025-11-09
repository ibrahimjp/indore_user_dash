import React, { useMemo } from "react";
import "./CaseReportModal.css";

const formatDateTime = (timestamp) => {
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
};

const CaseReportView = ({
  report,
  session,
  variant = "page",
  onClose,
  onBack,
}) => {
  const meta = useMemo(() => {
    const issuedAt = report?.issuedAt || report?.generatedAt;
    const { date, time } = formatDateTime(issuedAt);
    return { date, time };
  }, [report]);

  if (!report) {
    return null;
  }

  const patientDetails = report.patientDetails || {};
  const consultationSummary = report.consultationSummary || {};
  const diagnosedIssues = Array.isArray(report.diagnosedIssues)
    ? report.diagnosedIssues
    : [];
  const prescription = Array.isArray(report.prescription)
    ? report.prescription
    : [];
  const additionalNotes = Array.isArray(report.additionalNotes)
    ? report.additionalNotes
    : [];
  const doctorRecommendation = report.doctorRecommendation || {};
  const sessionMeta = session || report.session || null;

  const formatPatientRow = (label, value) => (
    <div className="case-report-detail-card" key={label}>
      <span className="label">{label}</span>
      <span className="value">
        {value && value !== "Not specified" ? value : "Not specified"}
      </span>
    </div>
  );

  return (
    <div
      className={
        variant === "modal" ? "case-report-modal" : "case-report-page"
      }
    >
      <header className="case-report-modal__header">
        <div className="case-report-modal__title">
          {variant === "page" && onBack && (
            <button
              type="button"
              className="case-report-back"
              onClick={onBack}
              aria-label="Back to reports"
            >
              ← Back
            </button>
          )}
          <h2>{report.title || "Clinical Consultation Summary"}</h2>
          <p className="meta">
            <span>{meta.date}</span>
            <span>•</span>
            <span>{meta.time}</span>
            {sessionMeta?.title && (
              <>
                <span>•</span>
                <span>{sessionMeta.title}</span>
              </>
            )}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            className="case-report-modal__close"
            onClick={onClose}
            aria-label="Close case report"
          >
            ✕
          </button>
        )}
      </header>

      <section className="case-report-section">
        <div className="section-heading">
          <h3>Patient Details</h3>
          <span className="badge">
            {report.aiGenerated ? "AI Generated" : "Clinician Added"}
          </span>
        </div>
        <div className="case-report-grid patient-grid">
          {formatPatientRow("Patient Name", patientDetails.name)}
          {formatPatientRow(
            "Age / Gender",
            `${patientDetails.age || "Not specified"} / ${
              patientDetails.gender || "Not specified"
            }`
          )}
          {formatPatientRow("Patient ID", patientDetails.patientId)}
          {formatPatientRow("Blood Group", patientDetails.bloodGroup)}
          {formatPatientRow(
            "Weight / Height",
            `${patientDetails.weight || "Not specified"} / ${
              patientDetails.height || "Not specified"
            }`
          )}
          {formatPatientRow("Contact", patientDetails.contact)}
        </div>
      </section>

      <section className="case-report-section">
        <div className="section-heading">
          <h3>Consultation Summary</h3>
        </div>
        <div className="summary-block">
          <p>
            <span className="summary-label">Chief Complaint:</span>{" "}
            {consultationSummary.chiefComplaint ||
              "Not specified by the assistant."}
          </p>
          <p>
            <span className="summary-label">History:</span>{" "}
            {consultationSummary.history ||
              "Not specified by the assistant."}
          </p>
          <p>
            <span className="summary-label">Examination Findings:</span>{" "}
            {consultationSummary.examinationFindings ||
              "Not specified by the assistant."}
          </p>
        </div>
      </section>

      {diagnosedIssues.length > 0 && (
        <section className="case-report-section">
          <div className="section-heading">
            <h3>Diagnosed Issues</h3>
          </div>
          <ol className="diagnosis-list">
            {diagnosedIssues.map((issue, index) => (
              <li key={`${issue.title || "issue"}-${index}`}>
                <h4>{issue.title || "Issue"}</h4>
                <p>{issue.description || "Description not provided."}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {prescription.length > 0 && (
        <section className="case-report-section">
          <div className="section-heading">
            <h3>Prescription</h3>
          </div>
          <div className="prescription-table">
            <div className="table-header">
              <span>Medicine</span>
              <span>Dosage</span>
              <span>Frequency</span>
              <span>Duration</span>
              <span>Instructions</span>
            </div>
            {prescription.map((item, index) => (
              <div className="table-row" key={`${item.medicine}-${index}`}>
                <span>{item.medicine || "Not specified"}</span>
                <span>{item.dosage || "—"}</span>
                <span>{item.frequency || "—"}</span>
                <span>{item.duration || "—"}</span>
                <span>{item.instructions || "—"}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {additionalNotes.length > 0 && (
        <section className="case-report-section">
          <div className="section-heading">
            <h3>Additional Notes</h3>
          </div>
          <ul className="notes-list">
            {additionalNotes.map((note, index) => (
              <li key={`${note}-${index}`}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {doctorRecommendation?.specialty && (
        <section className="case-report-section">
          <div className="section-heading">
            <h3>Doctor Recommendation</h3>
          </div>
          <div className="recommendation-card">
            <p>
              <span className="summary-label">Specialty:</span>{" "}
              {doctorRecommendation.specialty}
            </p>
            <p>
              <span className="summary-label">Urgency:</span>{" "}
              {doctorRecommendation.urgency || "Not specified"}
            </p>
            <p>{doctorRecommendation.description || ""}</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default CaseReportView;
export { formatDateTime };


