import React from "react";
import "./Reports.css";

const Reports = () => {
  const reports = [
    {
      title: "Acute Myocardial Infarction with ST-Elevation",
      date: "November 05, 2024",
      time: "10:45am",
      id: "CR-2024-001",
    },
    {
      title: "Type 2 Diabetes Mellitus Management",
      date: "November 04, 2024",
      time: "11:30am",
      id: "CR-2024-002",
    },
    {
      title: "Community-Acquired Pneumonia Assessment",
      date: "November 03, 2024",
      time: "9:00am",
      id: "CR-2024-003",
    },
    {
      title: "Chronic Obstructive Pulmonary Disease Exacerbation",
      date: "November 02, 2024",
      time: "10:15am",
      id: "CR-2024-004",
    },
    {
      title: "Acute Appendicitis Pre-Operative Evaluation",
      date: "November 01, 2024",
      time: "10:30am",
      id: "CR-2024-005",
    },
    {
      title: "Hypertensive Crisis Management",
      date: "October 31, 2024",
      time: "7:00pm",
      id: "CR-2024-006",
    },
  ];

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
          <p className="count">{reports.length}</p>
        </div>
      </div>

      <hr className="divider" />

      <div className="reports-list">
        {reports.map((report, index) => (
          <div className="report-card" key={index}>
            <div className="report-title">
              <h2>{report.title}</h2>
            </div>
            <div className="report-details">
              <div className="detail-item">
                <h4>Issued Date</h4>
                <p>{report.date}</p>
              </div>
              <div className="detail-item">
                <h4>Issued Time</h4>
                <p>{report.time}</p>
              </div>
              <div className="detail-item">
                <h4>Report ID</h4>
                <p>{report.id}</p>
              </div>
              <div className="report-tag">
                <span>AI Generated</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
