import React, { useEffect, useRef, useContext } from "react";
import { UserContext } from "../../context/UserContext";
import Chart from "chart.js/auto";
import "./Dashboard.css";

const Dashboard = () => {
  const chartRef = useRef(null);
  let healthChart = useRef(null);
  const { userData, appointments } = useContext(UserContext);

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    if (healthChart.current) healthChart.current.destroy();

    healthChart.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["M", "T", "W", "T", "F"],
        datasets: [
          {
            label: "Health Check-ins",
            data: [15, 20, 18, 22, 21],
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
          },
        },
        plugins: {
          legend: { labels: { color: "#32cd87" } },
        },
      },
    });

    return () => {
      if (healthChart.current) healthChart.current.destroy();
    };
  }, []);

  // Get upcoming appointments (not cancelled and not completed)
  const upcomingAppointments = appointments
    .filter((apt) => !apt.cancelled && !apt.isCompleted)
    .slice(0, 3);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "short" };
    return date.toLocaleDateString("en-US", options);
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
        <h2>Welcome back, {userData?.name || "User"} 👋</h2>
        <div className="user">Profile</div>
      </div>

      <div className="dashboard">
        {/* Upcoming Appointments */}
        <div className="card">
          <h2>Upcoming Appointments</h2>
          {upcomingAppointments.length > 0 ? (
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
                {upcomingAppointments.map((appointment) => (
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
        <div className="card graph">
          <h2>Weekly Health Check-ins</h2>
          <div className="chart-wrapper">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card">
          <h2>Recent Reports</h2>
          <table>
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Date</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Blood Test</td>
                <td>5 Nov</td>
                <td>Lab Report</td>
              </tr>
              <tr>
                <td>X-Ray Chest</td>
                <td>3 Nov</td>
                <td>Radiology</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Prescriptions */}
        <div className="card">
          <h2>Prescriptions</h2>
          <div className="prescription">
            <div className="pill-icon">💊</div>
            <div className="prescription-details">
              <h4>Dr. Meera Kapoor</h4>
              <p>Amoxicillin 250mg</p>
            </div>
          </div>
          <div className="prescription">
            <div className="pill-icon">💊</div>
            <div className="prescription-details">
              <h4>Dr. John Thomas</h4>
              <p>Ongoing</p>
            </div>
          </div>
        </div>

        {/* Recent Chats */}
        <div className="card">
          <h2>Recent Chats</h2>
          <div className="chat">
            <img
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt="Dr. Meera"
            />
            <div>
              <h4>Dr. Meera Kapoor</h4>
              <p>How are you feeling today?</p>
            </div>
          </div>
        </div>

        {/* Health Tips */}
        <div className="card">
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
