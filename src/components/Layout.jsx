import React, { useContext, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import "./Layout.css";

const Layout = () => {
  const navigate = useNavigate();
  const { token, logoutUser, userData } = useContext(UserContext);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logoutUser();
      toast.success("Logged out successfully");
      navigate("/login");
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">User-Dashboard</div>
        <nav className="menu">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <span className="icon">🏠</span> Dashboard
          </NavLink>
          <NavLink
            to="/appointments"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <span className="icon">📅</span> Appointments
          </NavLink>
          <NavLink
            to="/prescriptions"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <span className="icon">💊</span> Prescriptions
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <span className="icon">📂</span> Reports
          </NavLink>
          <NavLink
            to="/messages"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <span className="icon">💬</span> Messages
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <span className="icon">⚙️</span> Settings
          </NavLink>
          <div className="menu-item logout" onClick={handleLogout}>
            <span className="icon">🚪</span> Logout
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
