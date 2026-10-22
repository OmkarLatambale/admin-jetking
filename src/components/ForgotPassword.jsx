import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(""); 
  const [success, setSuccess] = useState(""); 
  const navigate = useNavigate();

  const getErrorMessage = (payload) => {
    if (!payload) return "Failed to send OTP";

    if (typeof payload === "string") return payload;

    if (typeof payload.error === "string") return payload.error;
    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.detail === "string") return payload.detail;

    if (payload.error && typeof payload.error === "object") {
      if (typeof payload.error.message === "string") return payload.error.message;
      const errorMessages = Object.values(payload.error).flat().join(" ");
      if (errorMessages) return errorMessages;
    }

    const fieldMessages = Object.values(payload).flat().join(" ");
    return fieldMessages || "Failed to send OTP";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log("Forgot password email:", email);
 
    if (!email) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(""); 
    setSuccess(""); 
    const API_URL = `${import.meta.env.VITE_API_URL}send-otp/`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }), 
      });

      const textBody = await response.text();
      const data = textBody ? JSON.parse(textBody) : null;

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      localStorage.setItem("email", email);
      setSuccess("OTP sent successfully!");

      navigate("/enter-otp");
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "Received unexpected response from server."
          : err.message || "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938] px-4">
      <div className="w-full max-w-md rounded-lg bg-[#1b1527] p-8 shadow-lg">
        <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f1ff]">
          Forgot Password
        </h2>
        <p className="mb-6 text-center text-[#b9b0d2]">Enter your Email Id</p>
  
        {error && (
          <p className="text-center text-red-600 mb-4">{error}</p>
        )}
      
        {success && (
          <p className="text-center text-green-600 mb-4">{success}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-[#483b63] bg-[#191427] px-4 py-2 text-[#f5f1ff] placeholder:text-slate-400 focus:border-[#b89cff] focus:outline-none"
          />

          <button
            type="submit"
            className="w-full rounded-md bg-[#8d73ea] px-4 py-2 text-white hover:bg-[#a88fff] focus:outline-none"
            disabled={loading} 
          >
            {loading ? "Sending OTP..." : "Submit"}
          </button>
        </form>

        <div className="mt-6">
          <Link
            to="/"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-[#483b63] px-4 py-2 text-sm font-medium text-[#c7b6ff] transition hover:border-[#b89cff] hover:text-[#e2d8ff]"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
