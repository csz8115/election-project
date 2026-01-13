import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./app-layout"; // adjust path
import Login from "./login";
import Dashboard from "./dashboard";
import UserDashboard from "./user-dashboard";
import OfficerDashboard from "./officer-dashboard";
import EmpBallot from "./EmpBallot";
import ProtectedRoute from "./protected-route";
import EmployeeDashboard from "./employee-dashboard";
import UserBallot from "./UserBallot";
import CompanyStats from "./company-stats";
import AddBallot from "./add-ballot";
import UsersPage from "./users-page";
import AdminDashboard from "./admin-dashboard";
import Ballot from "./ballot";
import CreateBallot from "./create-ballot"

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
    path: "users-page",
    element: (
      <ProtectedRoute allowedRoles={["Employee", "Officer", "Admin"]}>
        <UsersPage />
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
