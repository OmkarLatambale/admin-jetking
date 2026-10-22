import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const EnterOtp = () => {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("OTP is required");
      return;
    }

    const email = localStorage.getItem("email");

    if (!email) {
      toast.error("No email found. Please go back to the forgot password page.");
      return;
    }
    const data = { email, otp };
 
    const API_URL = `${import.meta.env.VITE_API_URL}verify-otp/`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data), 
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseData?.error || responseData?.message || "Failed to verify OTP");
      }

      toast.success("OTP verified successfully");
      navigate("/change-password");
    } catch (err) {
      toast.error(err.message || "Failed to verify OTP. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938] px-4">
      <div className="w-full max-w-md rounded-lg bg-[#1b1527] p-8 shadow-lg text-center">
        <h2 className="mb-4 text-2xl font-bold text-[#f5f1ff]">Forgot Password</h2>
        <p className="mb-6 text-lg font-medium text-[#cbc1e4]">
          Enter the OTP you received on your email
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full rounded-md border border-[#483b63] bg-[#191427] px-4 py-2 text-[#f5f1ff] placeholder:text-slate-400 focus:border-[#b89cff] focus:outline-none"
          />

          <button
            type="submit"
            className="w-full rounded-md bg-[#8d73ea] px-4 py-2 text-white hover:bg-[#8d73ea] focus:outline-none"
          >
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
};

export default EnterOtp;
