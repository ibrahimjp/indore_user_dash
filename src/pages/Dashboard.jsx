import React, { useEffect, useRef, useContext, useState, useCallback } from "react";
import { UserContext } from "../../context/UserContext";
import { apiClient } from "../utils/api";
import Chart from "chart.js/auto";
import "./Dashboard.css";

const Dashboard = () => {
  const chartRef = useRef(null);
  let healthChart = useRef(null);
  const { userData, appointments, upcomingAppointments, getUpcomingAppointments, chatHistory, getChatHistory } = useContext(UserContext);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Load reports
  const loadReports = useCallback(async () => {
    try {
      setLoadingReports(true);
      const { data } = await apiClient.get("/api/reports");
      setReports(data?.reports || []);
    } catch (error) {
      console.error("Error loading reports:", error);
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  // Fetch data when component mounts (only once)
  useEffect(() => {
    getUpcomingAppointments();
    getChatHistory();
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Calculate health check-ins from appointments
  const calculateHealthCheckins = useCallback(() => {
    const now = new Date();
    const last7Days = [];
    const checkins = [0, 0, 0, 0, 0, 0, 0]; // Last 7 days

    // Get last 7 days labels
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      last7Days.push(dayName);
    }

    // Count appointments per day
    appointments.forEach((appointment) => {
      try {
        const appointmentDate = new Date(appointment.slotDate);
        const daysDiff = Math.floor((now - appointmentDate) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 7) {
          checkins[6 - daysDiff]++;
        }
      } catch (error) {
        // Skip invalid dates
      }
    });

    return { labels: last7Days, data: checkins };
  }, [appointments]);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d");

      if (healthChart.current) healthChart.current.destroy();

      const { labels, data } = calculateHealthCheckins();

      healthChart.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Appointments",
              data: data,
              borderColor: "#32cd87",
              backgroundColor: "rgba(50,205,135,0.1)",
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: "#32cd87",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: "#aaa" },
              grid: { color: "#1f1f1f" },
            },
            y: {
              ticks: { color: "#aaa" },
              grid: { color: "#1f1f1f" },
              beginAtZero: true,
            },
          },
          plugins: {
            legend: { labels: { color: "#32cd87" } },
          },
        },
      });
    }

    return () => {
      if (healthChart.current) healthChart.current.destroy();
    };
  }, [calculateHealthCheckins]);

  // Get upcoming appointments from context (already filtered by backend)
  // If no upcoming appointments, show recent non-cancelled appointments as fallback
  const displayUpcomingAppointments = upcomingAppointments.length > 0 
    ? upcomingAppointments.slice(0, 3)
    : appointments
        .filter(apt => !apt.cancelled && !apt.isCompleted)
        .slice(0, 3);
  
  // Get recent reports (last 2)
  const recentReports = reports.slice(0, 2);
  
  // Get recent chats (last 1)
  const recentChats = chatHistory.slice(0, 1);
  
  // Format report date
  const formatReportDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    } catch {
      return "N/A";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      // Handle different date formats
      let date;
      if (typeof dateString === 'string') {
        // Try parsing as ISO date first
        date = new Date(dateString);
        // If invalid, try parsing as YYYY-MM-DD format
        if (isNaN(date.getTime())) {
          const parts = dateString.split('-');
          if (parts.length === 3) {
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            return "Invalid Date";
          }
        }
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      
      const options = { day: "numeric", month: "short" };
      return date.toLocaleDateString("en-US", options);
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Invalid Date";
    }
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  // Get status
  const getStatus = (appointment) => {
    if (appointment.cancelled) return "Cancelled";
    if (appointment.isCompleted) return "Completed";
    if (appointment.payment) return "Confirmed";
    return "Pending";
  };

  return (
    <div className="page-container">
      <div className="topbar">
        <h2>Welcome back, {userData?.name ? userData.name.trim() : "User"} 👋</h2>
        <button 
          className="user" 
          onClick={() => window.location.href = "http://localhost:5173/"}
          style={{ cursor: "pointer", border: "none" }}
        >
          Home
        </button>
      </div>

      <div className="dashboard">
        {/* Upcoming Appointments */}
        <div className="card fixed-height">
          <h2>Upcoming Appointments</h2>
          {displayUpcomingAppointments.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayUpcomingAppointments.map((appointment) => (
                  <tr key={appointment._id}>
                    <td>{appointment.docData?.name || "N/A"}</td>
                    <td>{formatDate(appointment.slotDate)}</td>
                    <td>{formatTime(appointment.slotTime)}</td>
                    <td
                      className={`status-${
                        appointment.payment ? "confirmed" : "pending"
                      }`}
                    >
                      {getStatus(appointment)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "#888", padding: "20px 0" }}>
              No upcoming appointments
            </p>
          )}
        </div>

        {/* Weekly Health Check-ins */}
        <div className="card graph fixed-height">
          <h2>Weekly Health Check-ins</h2>
          <div className="chart-wrapper">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card fixed-height">
          <h2>Recent Reports</h2>
          {loadingReports ? (
            <p style={{ color: "#888", padding: "20px 0" }}>Loading reports...</p>
          ) : recentReports.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Date</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.reportId}>
                    <td>{report.title || "Case Report"}</td>
                    <td>{formatReportDate(report.issuedAt)}</td>
                    <td>{report.aiGenerated ? "AI Generated" : "Manual"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "#888", padding: "20px 0" }}>
              No reports yet
            </p>
          )}
        </div>

        {/* Recent Chats */}
        <div className="card fixed-height">
          <h2>Recent Chats</h2>
          {recentChats.length > 0 ? (
            recentChats.map((chat) => (
              <div key={chat.docId} className="chat">
                <img
                  src={chat.avatar || chat.doctor?.image || "https://via.placeholder.com/48"}
                  alt={chat.doctor || "Doctor"}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/48";
                  }}
                />
                <div>
                  <h4>{chat.doctor || "Doctor"}</h4>
                  <p>{chat.lastMessage || "No messages yet"}</p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "#888", padding: "20px 0" }}>
              No recent chats
            </p>
          )}
        </div>

        {/* Health Tips */}
        <div className="card fixed-height">
          <h2>Health Tips</h2>
          <div className="tip">
            <span>💧</span>Drink 2L water daily
          </div>
          <div className="tip">
            <span>💉</span>Flu shots available — book now!
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
