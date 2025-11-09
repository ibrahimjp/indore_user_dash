import React, { useContext, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import ChatModal from "../components/ChatModal";
import "./Appointments.css";

const Appointments = () => {
  const { appointments, cancelAppointment, loading, userData } =
    useContext(UserContext);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      let date;
      
      if (typeof dateString === 'string') {
        // Trim whitespace
        const trimmed = dateString.trim();
        
        // Try ISO format first (most common)
        date = new Date(trimmed);
        
        // If invalid, try YYYY-MM-DD format (common format)
        if (isNaN(date.getTime())) {
          const dashParts = trimmed.split('-');
          if (dashParts.length === 3) {
            const year = parseInt(dashParts[0], 10);
            const month = parseInt(dashParts[1], 10) - 1; // Month is 0-indexed
            const day = parseInt(dashParts[2], 10);
            
            if (!isNaN(year) && !isNaN(month) && !isNaN(day) && 
                year > 0 && month >= 0 && month < 12 && day > 0 && day <= 31) {
              date = new Date(year, month, day);
            }
          }
          
          // If still invalid, try MM/DD/YYYY or DD/MM/YYYY format
          if (isNaN(date.getTime())) {
            const slashParts = trimmed.split('/');
            if (slashParts.length === 3) {
              // Try MM/DD/YYYY first (US format)
              const month2 = parseInt(slashParts[0], 10) - 1;
              const day2 = parseInt(slashParts[1], 10);
              const year2 = parseInt(slashParts[2], 10);
              
              if (!isNaN(year2) && !isNaN(month2) && !isNaN(day2) &&
                  year2 > 0 && month2 >= 0 && month2 < 12 && day2 > 0 && day2 <= 31) {
                date = new Date(year2, month2, day2);
              }
            }
          }
          
          // If still invalid, try DD-MM-YYYY format
          if (isNaN(date.getTime()) && trimmed.includes('-')) {
            const parts = trimmed.split('-');
            if (parts.length === 3) {
              const day3 = parseInt(parts[0], 10);
              const month3 = parseInt(parts[1], 10) - 1;
              const year3 = parseInt(parts[2], 10);
              
              if (!isNaN(year3) && !isNaN(month3) && !isNaN(day3) &&
                  year3 > 0 && month3 >= 0 && month3 < 12 && day3 > 0 && day3 <= 31) {
                date = new Date(year3, month3, day3);
              }
            }
          }
        }
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Could not parse date:", dateString);
        // Return the original string so user can at least see what's there
        return dateString;
      }
      
      const options = { day: "numeric", month: "long", year: "numeric" };
      return date.toLocaleDateString("en-US", options);
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      // Return the original string if parsing fails
      return typeof dateString === 'string' ? dateString : "Invalid Date";
    }
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  // Get status
  const getStatus = (appointment) => {
    if (appointment.cancelled) return "cancelled";
    if (appointment.isCompleted) return "success";
    if (appointment.payment) return "success";
    return "pending";
  };

  const getStatusText = (appointment) => {
    if (appointment.cancelled) return "Cancelled";
    if (appointment.isCompleted) return "Completed";
    if (appointment.payment) return "Confirmed";
    return "Pending";
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      const result = await cancelAppointment(appointmentId);
      if (result.success) {
        toast.success("Appointment cancelled successfully");
      } else {
        toast.error(result.message || "Failed to cancel appointment");
      }
    }
  };

  const handleOpenChat = (doctor, docId) => {
    setSelectedDoctor(doctor);
    setSelectedDocId(docId);
    setChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setChatModalOpen(false);
    setSelectedDoctor(null);
    setSelectedDocId(null);
  };

  // Calculate stats
  const total = appointments.length;
  const success = appointments.filter((a) => a.payment && !a.cancelled).length;
  const pending = appointments.filter(
    (a) => !a.payment && !a.cancelled && !a.isCompleted,
  ).length;
  const cancelled = appointments.filter((a) => a.cancelled).length;

  return (
    <div className="page-container">
      <div className="topbar">
        <h2>Welcome back, {userData?.name || "User"} 👋</h2>
        <button 
          className="user" 
          onClick={() => window.location.href = "http://localhost:5173/"}
          style={{ cursor: "pointer", border: "none" }}
        >
          Home
        </button>
      </div>

      <div className="appointments-container">
        <div className="appointments-header">
          <h1>All Appointments</h1>
          <span>{appointments.length} appointments</span>
        </div>

        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{success}</div>
            <div className="stat-label">Confirmed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{cancelled}</div>
            <div className="stat-label">Cancelled</div>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="no-appointments">
            <p>No appointments found. Book your first appointment!</p>
          </div>
        ) : (
          <div className="appointment-list">
            {appointments.map((appointment) => (
              <div className="appointment-item" key={appointment._id}>
                <div className="doctor-header">
                  <div className="doctor-info">
                    <img
                      src={
                        appointment.docData?.image ||
                        "https://via.placeholder.com/50"
                      }
                      alt="Doctor"
                      className="doctor-photo"
                    />
                    <div>
                      <span>{appointment.docData?.name || "N/A"}</span>
                      <span className="doctor-specialty">
                        {appointment.docData?.speciality || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <button
                      className="message-btn"
                      onClick={() =>
                        handleOpenChat(appointment.docData, appointment.docId)
                      }
                      title="Message Doctor"
                    >
                      💬 Message
                    </button>
                    {!appointment.cancelled && !appointment.isCompleted && (
                      <button
                        className="delete-btn"
                        onClick={() => handleCancelAppointment(appointment._id)}
                        disabled={loading}
                      >
                        {loading ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="appointment-details">
                  <div>
                    <strong>Date:</strong> {formatDate(appointment.slotDate)}
                  </div>
                  <div>
                    <strong>Time:</strong> {formatTime(appointment.slotTime)}
                  </div>
                  <div>
                    <strong>Specialty:</strong>{" "}
                    {appointment.docData?.speciality || "N/A"}
                  </div>
                  <div>
                    <strong>Fee:</strong> ${appointment.amount || 0}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span className={`status-${getStatus(appointment)}`}>
                      {getStatusText(appointment)}
                    </span>
                  </div>
                  <div>
                    <strong>Payment:</strong>{" "}
                    {appointment.payment ? "Paid" : "Pending"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatModalOpen}
        onClose={handleCloseChat}
        doctor={selectedDoctor}
        docId={selectedDocId}
      />
    </div>
  );
};

export default Appointments;
