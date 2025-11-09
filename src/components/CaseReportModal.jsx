import React from "react";
import CaseReportView from "./CaseReportView";

const CaseReportModal = ({ isOpen, onClose, report, session }) => {
  if (!isOpen || !report) {
    return null;
  }

  return (
    <div className="case-report-modal-overlay" role="dialog" aria-modal="true">
      <CaseReportView
        variant="modal"
        report={report}
        session={session}
        onClose={onClose}
      />
    </div>
  );
};

export default CaseReportModal;


