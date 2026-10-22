import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import RecruiterHome from "./modules/admin/pages/RecruiterHome";
import PerformanceReports from "./modules/admin/pages/PerformanceReports";
import AddTrainer from "./modules/admin/pages/AddTrainer";
import PlacementOfficerManagement from "./modules/admin/pages/PlacementOfficerManagement";
import PlacementSection from "./modules/admin/pages/PlacementSection";
import JDRepository from "./modules/admin/pages/JDRepository";

import Sidebar from "./components/Sidebar";
import PrivateRoute from "./components/PrivateRoute";
import ViewReport from "./modules/admin/pages/ViewReport";
import ForgotPassword from "./components/ForgotPassword";
import EnterOtp from "./components/EnterOtp";
import ChangePassword from "./components/ChangePassword";

// branch admin imports
import BranchAdminSidebar from "./components/BranchAdminSidebar";
import BranchAdminDashboard from "./modules/branchAdmin/pages/BranchAdminDashboard";
import BAScheduleInterview from "./modules/branchAdmin/pages/BAScheduleInterview";
import BAPerformanceReport from "./modules/branchAdmin/pages/BAPerformanceReport";
import BAViewReport from "./modules/branchAdmin/pages/BAViewReport";

// placement officer imports
import PlacementOfficerSidebar from "./components/PlacementOfficerSidebar";
import PODashboard from "./modules/placementOfficer/pages/PODashboard";
import POPerformanceReport from "./modules/placementOfficer/pages/POPerformanceReport";
import POViewReport from "./modules/placementOfficer/pages/POViewReport";
import ScheduleInterview from "./modules/admin/pages/ScheduleInterview";

function App() {
  return (
    <Router basename="/admin">
      <div className="min-h-screen bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/enter-otp" element={<EnterOtp />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* TPO Routes */}
          <Route
            path="/recruiter-home"
            element={
              <PrivateRoute allowedRoles={["tpo"]}>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <RecruiterHome />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/placement-section"
            element={
              <PrivateRoute allowedRoles={["tpo"]}>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <PlacementSection />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/add-trainer"
            element={
              <PrivateRoute allowedRoles={["tpo"]}>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <AddTrainer />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/placement-officer-management"
            element={
              <PrivateRoute allowedRoles={["tpo"]}>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <PlacementOfficerManagement />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/jd-repository"
            element={
              <PrivateRoute allowedRoles={["tpo"]}>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <JDRepository />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <PrivateRoute allowedRoles={["tpo"]}>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <PerformanceReports />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/reports/:id"
            element={
              <PrivateRoute allowedRoles={["tpo"]}>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <ViewReport />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          {/* Academic Head Routes */}
          <Route
            path="/branch-admin/dashboard"
            element={
              <PrivateRoute allowedRoles={["academic_head"]}>
                <div className="flex h-screen">
                  <BranchAdminSidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <BranchAdminDashboard />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/branch-admin/schedule-interview"
            element={
              <PrivateRoute allowedRoles={["academic_head"]}>
                <div className="flex h-screen">
                  <BranchAdminSidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <BAScheduleInterview />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/branch-admin/reports"
            element={
              <PrivateRoute allowedRoles={["academic_head"]}>
                <div className="flex h-screen">
                  <BranchAdminSidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <BAPerformanceReport />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/branch-admin/reports/:id"
            element={
              <PrivateRoute allowedRoles={["academic_head"]}>
                <div className="flex h-screen">
                  <BranchAdminSidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <BAViewReport />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          {/* Placement Officer Routes */}
          <Route
            path="/placement-officer/dashboard"
            element={
              <PrivateRoute allowedRoles={["placement_officer"]}>
                <div className="flex h-screen">
                  <PlacementOfficerSidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <PODashboard />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/placement-officer/jd-repository"
            element={
              <PrivateRoute allowedRoles={["placement_officer"]}>
                <div className="flex h-screen">
                  <PlacementOfficerSidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <JDRepository />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/placement-officer/schedule-interview"
            element={
              <PrivateRoute allowedRoles={["placement_officer"]}>
                <div className="flex h-screen">
                  <PlacementOfficerSidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <ScheduleInterview />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/placement-officer/reports"
            element={
              <PrivateRoute allowedRoles={["placement_officer"]}>
                <div className="flex h-screen">
                  <PlacementOfficerSidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <POPerformanceReport />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/placement-officer/reports/:id"
            element={
              <PrivateRoute allowedRoles={["placement_officer"]}>
                <div className="flex h-screen">
                  <PlacementOfficerSidebar />
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
                    <POViewReport />
                  </div>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}
// function App() {
//   return (
//     <Router basename="/admin">
//       <div className="min-h-screen bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
//         <Routes>
//           {/* Public Routes */}
//           <Route path="/" element={<Login />} />
//           <Route path="/forgot-password" element={<ForgotPassword />} />
//           <Route path="/enter-otp" element={<EnterOtp />} />
//           <Route path="/change-password" element={<ChangePassword />} />

//           {/* TPO / Admin Routes */}
//           <Route
//             path="/recruiter-home"
//             element={
//               <div className="flex h-screen">
//                 <Sidebar />
//                 <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
//                   <RecruiterHome />
//                 </div>
//               </div>
//             }
//           />

//           <Route
//             path="/add-trainer"
//             element={
//               <div className="flex h-screen">
//                 <Sidebar />
//                 <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
//                   <AddTrainer />
//                 </div>
//               </div>
//             }
//           />

//           <Route
//             path="/reports"
//             element={
//               <div className="flex h-screen">
//                 <Sidebar />
//                 <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
//                   <PerformanceReports />
//                 </div>
//               </div>
//             }
//           />

//           <Route
//             path="/reports/:id"
//             element={
//               <div className="flex h-screen">
//                 <Sidebar />
//                 <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
//                   <ViewReport />
//                 </div>
//               </div>
//             }
//           />

//           {/* Branch Admin Routes */}
//           <Route
//             path="/branch-admin/dashboard"
//             element={
//               <div className="flex h-screen">
//                 <BranchAdminSidebar />
//                 <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
//                   <BranchAdminDashboard />
//                 </div>
//               </div>
//             }
//           />

//           <Route
//             path="/branch-admin/schedule-interview"
//             element={
//               <div className="flex h-screen">
//                 <BranchAdminSidebar />
//                 <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
//                   <BAScheduleInterview />
//                 </div>
//               </div>
//             }
//           />

//           <Route
//             path="/branch-admin/reports"
//             element={
//               <div className="flex h-screen">
//                 <BranchAdminSidebar />
//                 <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
//                   <BAPerformanceReport />
//                 </div>
//               </div>
//             }
//           />

//           <Route
//             path="/branch-admin/reports/:id"
//             element={
//               <div className="flex h-screen">
//                 <BranchAdminSidebar />
//                 <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
//                   <BAViewReport />
//                 </div>
//               </div>
//             }
//           />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

export default App;
