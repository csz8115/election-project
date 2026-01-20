import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./app-layout"; // adjust path
import Login from "./login";
import Dashboard from "./dashboard-routes/dashboard";
import UserDashboard from "./dashboard-routes/user-dashboard";
import OfficerDashboard from "./dashboard-routes/officer-dashboard";
import EmpBallot from "./ballot-routes/emp-ballot";
import ProtectedRoute from "./protected-route";
import EmployeeDashboard from "./dashboard-routes/employee-dashboard";
import UserBallot from "./ballot-routes/user-ballot";
import CompanyStats from "./company-stats";
import AddBallot from "./ballot-routes/add-ballot";
import AdminDashboard from "./dashboard-routes/admin-dashboard";
import Ballot from "./ballot-routes/ballot";
import CreateBallot from "./ballot-routes/create-ballot";
import Candidate from "./candidate-routes/candidate";
import CreateCandidate from "./candidate-routes/create-candidate";

export const router = createBrowserRouter([
  // Public route (no navbar)
  {
    path: "/login",
    element: <Login />,
  },

  // App routes (navbar persists here)
  {
    path: "/",
    element: <AppLayout />,

    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "ballot",
        element: (
          <Ballot />
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute allowedRoles={["Employee", "Member", "Officer", "Admin"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "candidate/:candidateId",
        element: (
          <ProtectedRoute allowedRoles={["Employee", "Member", "Officer", "Admin"]}>
            <Candidate />
          </ProtectedRoute>
        ),
      },
      {
        path: "create-candidate",
        element: (
          <ProtectedRoute allowedRoles={["Employee", "Officer", "Admin"]}>
            <CreateCandidate />
          </ProtectedRoute>
        ),
      },
      {
        path: "employee-dashboard",
        element: (
          <ProtectedRoute allowedRoles={["Employee"]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        ),
      },

      {
        path: "create-ballot",
        element: (
          <ProtectedRoute allowedRoles={["Employee", "Admin"]}>
            <CreateBallot />
          </ProtectedRoute>
      ),
      },

  {
    path: "employee-ballot",
    element: (
      <ProtectedRoute allowedRoles={["Employee", "Officer", "Admin"]}>
        <EmpBallot />
      </ProtectedRoute>
    ),
  },

  {
    path: "officer-dashboard",
    element: (
      <ProtectedRoute allowedRoles={["Officer"]}>
        <OfficerDashboard />
      </ProtectedRoute>
    ),
  },

  {
    path: "admin-dashboard",
    element: (
      <ProtectedRoute allowedRoles={["Admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },

  {
    path: "company-stats",
    element: (
      <ProtectedRoute allowedRoles={["Employee", "Officer", "Admin"]}>
        <CompanyStats />
      </ProtectedRoute>
    ),
  },

  {
    path: "add-ballot",
    element: (
      <ProtectedRoute allowedRoles={["Employee", "Officer", "Admin"]}>
        <AddBallot />
      </ProtectedRoute>
    ),
  },

  {
    path: "user-dashboard",
    element: (
      <ProtectedRoute allowedRoles={["Member"]}>
        <UserDashboard />
      </ProtectedRoute>
    ),
  },

  {
    path: "user-ballot",
    element: (
      <ProtectedRoute allowedRoles={["Member"]}>
        <UserBallot />
      </ProtectedRoute>
    ),
  },

  {
    path: "unauthorized",
    element: (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-slate-100">Unauthorized</h1>
      </div>
    ),
  },
],
  },
]);
