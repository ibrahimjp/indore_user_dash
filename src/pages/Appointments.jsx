import React, { useContext } from "react";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import "./Appointments.css";

const Appointments = () => {
  const { appointments, cancelAppointment, loading, userData } =
    useContext(UserContext);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
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
        <div className="user">Profile</div>
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
                  <div>
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
    </div>
  );
};

export default Appointments;
