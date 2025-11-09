import axios from "axios";

const normalizeBackendUrl = (value) => {
  if (typeof value !== "string") {
    return "http://localhost:8000";
  }

  const trimmed = value.replace(/^['"]+|['"]+$/g, "").trim();
  if (!trimmed) {
    return "http://localhost:8000";
  }

  return trimmed.replace(/\/+$/, "");
};

const backendUrl = normalizeBackendUrl(import.meta.env.VITE_BACKEND_URL);

let websocketBaseUrl = "ws://localhost:8000";
try {
  const parsedUrl = new URL(backendUrl);
  websocketBaseUrl = `${
    parsedUrl.protocol === "https:" ? "wss:" : "ws:"
  }//${parsedUrl.host}`;
} catch (error) {
  console.warn("Failed to derive websocket url from backendUrl:", error);
}

/**
 * Check if backend API is reachable
 * @returns {Promise<boolean>}
 */
export const checkBackendConnection = async () => {
  try {
    const response = await axios.get(backendUrl, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error("Backend connection failed:", error.message);
    return false;
  }
};

/**
 * Get backend API base URL
 * @returns {string}
 */
export const getBackendUrl = () => {
  return backendUrl;
};

export const getWebsocketBaseUrl = () => {
  return websocketBaseUrl;
};

/**
 * Format error message from API response
 * @param {Error} error
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  if (error.response) {
    // Server responded with error
    return error.response.data?.message || "An error occurred";
  } else if (error.request) {
    // Request made but no response
    return "Cannot connect to server. Please check your connection.";
  } else {
    // Something else happened
    return error.message || "An unexpected error occurred";
  }
};

/**
 * Create axios instance with default config
 */
export const apiClient = axios.create({
  baseURL: backendUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Add token to request headers
 * @param {string} token
 */
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common["token"] = token;
  } else {
    delete apiClient.defaults.headers.common["token"];
  }
};

/**
 * Format date from backend to display format
 * @param {string} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    return dateString;
  }
};

/**
 * Format time for display
 * @param {string} timeString
 * @returns {string}
 */
export const formatTime = (timeString) => {
  if (!timeString) return "N/A";
  return timeString;
};

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

/**
 * Get appointment status text
 * @param {object} appointment
 * @returns {string}
 */
export const getAppointmentStatus = (appointment) => {
  if (appointment.cancelled) return "Cancelled";
  if (appointment.isCompleted) return "Completed";
  if (appointment.payment) return "Confirmed";
  return "Pending";
};

/**
 * Get appointment status color class
 * @param {object} appointment
 * @returns {string}
 */
export const getAppointmentStatusClass = (appointment) => {
  if (appointment.cancelled) return "status-cancelled";
  if (appointment.isCompleted) return "status-success";
  if (appointment.payment) return "status-success";
  return "status-pending";
};

/**
 * Calculate age from date of birth
 * @param {string} dob
 * @returns {number}
 */
export const calculateAge = (dob) => {
  if (!dob) return 0;

  try {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    return 0;
  }
};

/**
 * Format currency
 * @param {number} amount
 * @param {string} currency
 * @returns {string}
 */
export const formatCurrency = (amount, currency = "$") => {
  if (typeof amount !== "number") return `${currency}0`;
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("userToken");
  return !!token;
};

/**
 * Get stored token
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem("userToken");
};

/**
 * Store token
 * @param {string} token
 */
export const storeToken = (token) => {
  localStorage.setItem("userToken", token);
};

/**
 * Remove token
 */
export const removeToken = () => {
  localStorage.removeItem("userToken");
};

/**
 * Debounce function for search inputs
 * @param {Function} func
 * @param {number} delay
 * @returns {Function}
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default {
  checkBackendConnection,
  getBackendUrl,
  getErrorMessage,
  apiClient,
  setAuthToken,
  formatDate,
  formatTime,
  isValidEmail,
  isValidPhone,
  getAppointmentStatus,
  getAppointmentStatusClass,
  calculateAge,
  formatCurrency,
  isAuthenticated,
  getToken,
  storeToken,
  removeToken,
  debounce,
};
