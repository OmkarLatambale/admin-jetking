import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logoutService } from "../auth/authService";

const Sidebar = () => {
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
          <button
            onClick={() => navigate("/recruiter-home")}
            className={`py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer font-medium ${
              isActive("/recruiter-home")
                ? "bg-[#b89cff] text-[#120d1f] border border-[#dacbff] scale-[1.02]"
                : "bg-white/5 text-white hover:bg-white/10 hover:scale-[1.02] border border-white/10"
            }`}
          >
            Admin Dashboard
          </button>

          <button
            onClick={() => navigate("/placement-section")}
            className={`py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer font-medium ${
              isActive("/placement-section")
                ? "bg-[#b89cff] text-[#120d1f] border tracking-tight border-[#dacbff] scale-[1.02]"
                : "bg-white/5 text-white hover:bg-white/10 hover:scale-[1.02] tracking-tight border border-white/10"
            }`}
          >
            Placement Section
          </button>

          <button
            onClick={() => navigate("/jd-repository")}
            className={`py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer font-medium ${
              isActive("/jd-repository")
                ? "bg-[#b89cff] text-[#120d1f] border border-[#dacbff] scale-[1.02]"
                : "bg-white/5 text-white hover:bg-white/10 hover:scale-[1.02] border border-white/10"
            }`}
          >
            JD Repository
          </button>

          {/* <button
            onClick={() => navigate("/schedule-interview")}
            className={`py-3 rounded-xl transition-all duration-300 ease-in-out cursor-pointer font-medium ${
              isActive("/schedule-interview")
                ? "bg-[#1b1527] text-[#b9b0d2] shadow-lg border border-[#544274] scale-[1.02]"
                : "bg-[#1b1527]/6 text-white hover:bg-[#1b1527]/12 hover:scale-[1.02] border border-white/10"
            }`}
          >
            Schedule Interview
          </button> */}

          <button
            onClick={() => navigate("/reports")}
            className={`py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer font-medium ${
              isActive("/reports")
                ? "bg-[#b89cff] text-[#120d1f] border border-[#dacbff] scale-[1.02]"
                : "bg-white/5 text-white hover:bg-white/10 hover:scale-[1.02] border border-white/10"
            }`}
          >
            Performance Reports
          </button>

          <button
            onClick={() => navigate("/add-trainer")}
            className={`py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer font-medium ${
              isActive("/add-trainer")
                ? "bg-[#b89cff] text-[#120d1f] tracking-tighter border border-[#dacbff] scale-[1.02]"
                : "bg-white/5 text-white hover:bg-white/10 tracking-tighter hover:scale-[1.02] border border-white/10"
            }`}
          >
            Academic Head Management
          </button>

          <button
            onClick={() => navigate("/placement-officer-management")}
            className={`py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer font-medium ${
              isActive("/placement-officer-management")
                ? "bg-[#b89cff] text-[#120d1f] tracking-tighter border border-[#dacbff] scale-[1.02]"
                : "bg-white/5 text-white hover:bg-white/10 tracking-tighter hover:scale-[1.02] border border-white/10"
            }`}
          >
            Placement Ofc. Management
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

export default Sidebar;
