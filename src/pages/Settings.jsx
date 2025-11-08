import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import "./Settings.css";

const Settings = () => {
  const { userData, updateUserProfile, loading } = useContext(UserContext);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    bloodGroup: "",
    gender: "",
    addressLine1: "",
    addressLine2: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    healthTips: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load user data when component mounts
  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        dateOfBirth: userData.dob || "",
        bloodGroup: "",
        gender: userData.gender || "Not Selected",
        addressLine1: userData.address?.line1 || "",
        addressLine2: userData.address?.line2 || "",
      });
      setImagePreview(userData.image || null);
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications((prev) => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.dateOfBirth ||
      !formData.gender
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const profileData = {
      name: formData.fullName,
      phone: formData.phone,
      address: {
        line1: formData.addressLine1,
        line2: formData.addressLine2,
      },
      dob: formData.dateOfBirth,
      gender: formData.gender,
    };

    const result = await updateUserProfile(profileData, imageFile);
    if (result.success) {
      toast.success("Profile updated successfully!");
      setImageFile(null);
    } else {
      toast.error(result.message || "Failed to update profile");
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    toast.info("Password change functionality will be implemented soon!");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="page-container">
      <div className="topbar">
        <h2>Welcome back, {userData?.name || "User"} 👋</h2>
        <div className="user">Profile</div>
      </div>

      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>

        {/* Profile Settings */}
        <div className="settings-section">
          <h2 className="section-heading">Profile Information</h2>
          <form onSubmit={handleSaveProfile} className="settings-form">
            {/* Profile Image */}
            <div className="profile-image-section">
              <div className="profile-image-wrapper">
                <img
                  src={imagePreview || "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="profile-image"
                />
                <label htmlFor="profileImage" className="image-upload-label">
                  Change Photo
                </label>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled
                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth *</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Not Selected">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bloodGroup">Blood Group</label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="addressLine1">Address Line 1 *</label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="addressLine2">Address Line 2</label>
                <input
                  type="text"
                  id="addressLine2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="settings-section">
          <h2 className="section-heading">Security</h2>
          <form onSubmit={handleChangePassword} className="settings-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button type="submit" className="save-btn">
              Change Password
            </button>
          </form>
        </div>

        {/* Notification Settings */}
        <div className="settings-section">
          <h2 className="section-heading">Notification Preferences</h2>
          <p style={{ color: "#888", marginBottom: "20px", fontSize: "14px" }}>
            Note: These settings are stored locally and not synced with the
            backend
          </p>
          <div className="notifications-grid">
            <div className="notification-item">
              <div className="notification-info">
                <h3>Email Notifications</h3>
                <p>Receive notifications via email</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={notifications.emailNotifications}
                  onChange={handleNotificationChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <h3>SMS Notifications</h3>
                <p>Receive notifications via SMS</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="smsNotifications"
                  checked={notifications.smsNotifications}
                  onChange={handleNotificationChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <h3>Appointment Reminders</h3>
                <p>Get reminders before appointments</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="appointmentReminders"
                  checked={notifications.appointmentReminders}
                  onChange={handleNotificationChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <h3>Health Tips</h3>
                <p>Receive daily health tips and advice</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="healthTips"
                  checked={notifications.healthTips}
                  onChange={handleNotificationChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-section danger-zone">
          <h2 className="section-heading">Danger Zone</h2>
          <div className="danger-actions">
            <div className="danger-item">
              <div>
                <h3>Delete Account</h3>
                <p>Permanently delete your account and all data</p>
              </div>
              <button className="danger-btn">Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
