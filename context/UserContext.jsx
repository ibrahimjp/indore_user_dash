import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getBackendUrl } from "../src/utils/api";

export const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  const backendUrl = getBackendUrl();

  const [token, setToken] = useState(localStorage.getItem("userToken") || "");
  const [userData, setUserData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Register User
  const registerUser = async (name, email, password) => {
    try {
      setLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/user/register`, {
        name,
        email,
        password,
      });

      if (data.success) {
        setToken(data.token);
        localStorage.setItem("userToken", data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Login User
  const loginUser = async (email, password) => {
    try {
      setLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/user/login`, {
        email,
        password,
      });

      if (data.success) {
        setToken(data.token);
        localStorage.setItem("userToken", data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout User
  const logoutUser = () => {
    setToken("");
    setUserData(null);
    setAppointments([]);
    localStorage.removeItem("userToken");
  };

  // Get User Profile
  const getUserProfile = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/get-profile`, {
        headers: { token },
      });

      if (data.success) {
        setUserData(data.userData);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Update User Profile
  const updateUserProfile = async (profileData, imageFile) => {
    try {
      setLoading(true);
      const formData = new FormData();

      formData.append("name", profileData.name);
      formData.append("phone", profileData.phone);
      formData.append("address", JSON.stringify(profileData.address));
      formData.append("dob", profileData.dob);
      formData.append("gender", profileData.gender);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const { data } = await axios.post(
        `${backendUrl}/api/user/update-profile`,
        formData,
        { headers: { token } }
      );

      if (data.success) {
        await getUserProfile();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Update failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Get User Appointments
  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { token },
      });

      if (data.success) {
        setAppointments(data.appointments.reverse());
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  // Book Appointment
  const bookAppointment = async (docId, slotDate, slotTime) => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        { docId, slotDate, slotTime },
        { headers: { token } }
      );

      if (data.success) {
        await getUserAppointments();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Booking failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Cancel Appointment
  const cancelAppointment = async (appointmentId) => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { token } }
      );

      if (data.success) {
        await getUserAppointments();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Cancellation failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Make Payment
  const makePayment = async (appointmentId) => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        `${backendUrl}/api/user/make-payment`,
        { appointmentId },
        { headers: { token } }
      );

      if (data.success) {
        await getUserAppointments();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Payment failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Load user data on token change
  useEffect(() => {
    if (token) {
      getUserProfile();
      getUserAppointments();
    }
  }, [token]);

  const value = {
    token,
    setToken,
    userData,
    setUserData,
    appointments,
    setAppointments,
    loading,
    backendUrl,
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    getUserAppointments,
    bookAppointment,
    cancelAppointment,
    makePayment,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
