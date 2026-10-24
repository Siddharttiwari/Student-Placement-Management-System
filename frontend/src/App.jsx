
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import TPODashboard from "./pages/TPODashboard";
import CompanyManagement from "./pages/CompanyManagement";
import PlacementDriveManagement from "./pages/PlacementDriveManagement";
import AvailableJobs from "./pages/AvailableJobs";
import MyApplications from "./pages/MyApplications";
import TPOApplications from "./pages/TPOApplications";
import TPORecruitmentRounds from "./pages/TPORecruitmentRounds";
import TPOStudentRoundResults from "./pages/TPOStudentRoundResults";
import StudentRecruitmentProgress from "./pages/StudentRecruitmentProgress";
import TPOStudentManagement from "./pages/TPOStudentManagement";
import TPOStudentDetails from "./pages/TPOStudentDetails";

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
        <Route path="/tpo/drives/:driveId/rounds" element={<TPORecruitmentRounds />} />
        <Route path="/tpo/applications/:applicationId/rounds" element={<TPOStudentRoundResults />} />
        <Route path="/student/applications/:applicationId/rounds" element={<StudentRecruitmentProgress />} />
        <Route path="/tpo/students" element={<TPOStudentManagement />} />
        <Route path="/tpo/students/:studentId" element={<TPOStudentDetails />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
