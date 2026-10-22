import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logoutService } from "../auth/authService";

const BranchAdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutService();
    navigate("/", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 h-screen bg-[#0b0914] shadow-2xl flex flex-col justify-between border-r border-white/10">
      <div>
        {/* Logo */}
         <div className="p-1 border-b border-white/10 flex items-center backdrop-blur-sm">
          <img
            src="https://interviewbot-bucket.s3.ap-south-1.amazonaws.com/job-descriptions/Jetking_Logo-new.png"
            alt="Logo"
            className="h-17 mr-[-8px] rounded-md  p-2"
          />
          <h1 className="text-lg font-bold text-white tracking-tight">
            InterviewBot
          </h1>
        </div>

        {/* Navigation Buttons */}
        <nav className="flex flex-col mt-4 space-y-4 px-4">

          {/* Dashboard */}
          <button
            onClick={() => navigate("/branch-admin/dashboard")}
            className={`py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer font-medium ${
              isActive("/branch-admin/dashboard")
                ? "bg-[#b89cff] text-[#120d1f] border tracking-tight border-[#dacbff] scale-[1.02]"
                : "bg-white/5 text-white hover:bg-white/10 hover:scale-[1.02] tracking-tight border border-white/10"
            }`}
          >
           Academic-Head Dashboard
          </button>

          {/* Schedule Interview */}
          <button
            onClick={() => navigate("/branch-admin/schedule-interview")}
            className={`py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer font-medium ${
              isActive("/branch-admin/schedule-interview")
                ? "bg-[#b89cff] text-[#120d1f] border border-[#dacbff] scale-[1.02]"
                : "bg-white/5 text-white hover:bg-white/10 hover:scale-[1.02] border border-white/10"
            }`}
          >
            Schedule Interview
          </button>

          {/* Reports */}
          <button
            onClick={() => navigate("/branch-admin/reports")}
            className={`py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer font-medium ${
              isActive("/branch-admin/reports")
                ? "bg-[#b89cff] text-[#120d1f] border border-[#dacbff] scale-[1.02]"
                : "bg-white/5 text-white hover:bg-white/10 hover:scale-[1.02] border border-white/10"
            }`}
          >
            Performance Reports
          </button>

        </nav>
      </div>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full bg-white/5 cursor-pointer text-white py-2 rounded-xl hover:bg-[#8d73ea] transition-all duration-300 ease-in-out hover:scale-[1.02] shadow-md border border-white/10"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default BranchAdminSidebar;
