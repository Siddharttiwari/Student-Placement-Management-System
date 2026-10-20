
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import TPODashboard from "./pages/TPODashboard";
import CompanyManagement from "./pages/CompanyManagement";
import PlacementDriveManagement from "./pages/PlacementDriveManagement";
import AvailableJobs from "./pages/AvailableJobs";
import MyApplications from "./pages/MyApplications";
import TPOApplications from "./pages/TPOApplications";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/tpo/dashboard" element={<TPODashboard />} />
        <Route path="/tpo/companies" element={<CompanyManagement />} />
        <Route path="/tpo/drives" element={<PlacementDriveManagement />} />
        <Route path="/jobs" element={<AvailableJobs />} />
        <Route path="/applications" element={<MyApplications />} />
        <Route path="/tpo/applications" element={<TPOApplications />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
