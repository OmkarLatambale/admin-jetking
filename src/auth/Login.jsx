import React, { useState } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { useLogin } from "./useLogin";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const roleOptions = [
  { label: "Admin", value: "tpo" },
  { label: "Academic Head", value: "academic_head" },
  { label: "Placement Officer", value: "placement_officer" },
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // No default role selected
  const [loginType, setLoginType] = useState("");

  const { login, loading, error } = useLogin();
  const navigate = useNavigate();

  const selectedRoleLabel =
    roleOptions.find((role) => role.value === loginType)?.label || "";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!loginType) {
      toast.error("Please select your role");
      return;
    }

    const result = await login(email, password, loginType);

    if (result.status === "success") {
      toast.success("Login successful");

      if (loginType === "academic_head") {
        navigate("/branch-admin/dashboard");
      } else if (loginType === "placement_officer") {
        navigate("/placement-officer/dashboard");
      } else {
        navigate("/recruiter-home");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938] px-4">
      <div className="flex w-full max-w-4xl bg-[#191426]/95 rounded-2xl shadow-[0_24px_60px_rgba(3,2,8,0.5)] border border-[#3b3052] overflow-hidden">
        <div className="w-full md:w-1/2 p-8">
          <div className="flex justify-center mb-2">
            <img
              src=" https://interviewbot-bucket.s3.ap-south-1.amazonaws.com/job-descriptions/Jetking_Logo-new.png"
              alt="Jetking"
              className="h-10"
            />
          </div>

          <h2 className="text-2xl font-bold text-[#f5f1ff] text-center">
            Welcome!
          </h2>

          <p className="text-sm text-[#9487b8] text-center mt-2 mb-2">
            Select your role to access your dashboard.{" "}
          </p>

          <form className="mt-2" onSubmit={handleSubmit}>
            {/* Role Dropdown */}
            <div className="mb-4">
              <label className="block text-[#b9b0d2] text-sm mb-2">
                Login As
              </label>

              <div className="relative">
                <select
                  value={loginType}
                  onChange={(e) => setLoginType(e.target.value)}
                  className={`w-full appearance-none px-4 py-3 pr-11 border rounded-xl bg-[#191427] text-sm shadow-sm cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#b89cff] focus:border-[#b89cff] ${
                    loginType
                      ? "text-[#f5f1ff] border-[#483b63]"
                      : "text-slate-400 border-[#483b63]"
                  }`}
                  required
                >
                  <option value="" disabled>
                    Select your role
                  </option>

                  {roleOptions.map((role) => (
                    <option
                      key={role.value}
                      value={role.value}
                      className="text-[#f5f1ff]"
                    >
                      {role.label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9f8bc8] pointer-events-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[#b9b0d2] text-sm mb-2">
                Email Id
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#483b63] rounded-xl bg-[#191427] text-[#f5f1ff] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-[#b9b0d2] text-sm mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-11 border border-[#483b63] rounded-xl bg-[#191427] text-[#f5f1ff] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-sm text-[#9f8bc8] hover:text-[#b9b0d2] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="mr-2 cursor-pointer accent-[#b89cff]"
                />
                <label htmlFor="remember" className="text-sm text-[#b9b0d2]">
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-[#c7b6ff] transition hover:text-[#e2d8ff] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="text-sm text-[#B42318] bg-[#FEECEC] border border-[#F5C2C7] rounded-lg px-3 py-2 mb-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8d73ea] text-white py-2.5 rounded-xl hover:bg-[#a88fff] transition duration-200 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {loading
                ? "Logging in..."
                : selectedRoleLabel
                  ? `Login as ${selectedRoleLabel}`
                  : "Login"}
            </button>
          </form>
        </div>

        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#120d1f] via-[#1c1630] to-[#2a2140] items-center justify-center border-l border-[#3b3052]">
          <img
            src="https://interviewbot-bucket.s3.ap-south-1.amazonaws.com/job-descriptions/WhatsApp+Image+2026-09-11+at+11.02.37+PM.jpeg"
            alt="Interview Illustration"
            className="max-w-sm drop-shadow-md"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
