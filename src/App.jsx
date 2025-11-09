import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserContextProvider } from "../context/UserContext";
import { AiChatProvider } from "../context/AiChatContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Prescriptions from "./pages/Prescriptions";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import "./App.css";
import TalkToAi from "./pages/TalkToAi";

function App() {
  return (
    <UserContextProvider>
      <AiChatProvider>
        <Router>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="prescriptions" element={<Prescriptions />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/:reportId" element={<ReportDetail />} />
              <Route path="messages" element={<Messages />} />
              <Route path="settings" element={<Settings />} />
              <Route path="chat" element={<TalkToAi />} />
              <Route path="chat/:chatId" element={<TalkToAi />} />
            </Route>
          </Routes>
        </Router>
      </AiChatProvider>
    </UserContextProvider>
  );
}

export default App;
