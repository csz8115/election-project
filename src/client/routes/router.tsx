import {
  createBrowserRouter,
} from "react-router-dom";
import Login from "./login";
import Dashboard from "./dashboard";
import UserDashboard from "./user-dashboard";
import EmpBallot from "./EmpBallot";
import ProtectedRoute from "./protected-route";
import EmployeeDashboard from "./employee-dashboard";
import UserBallot from "./UserBallot";
import CompanyStats from "./company-stats";
import SystemStats from "./system-stats";
import AddBallot from "./add-ballot";
import UsersPage from "./users-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/employee-ballot",
    element: <ProtectedRoute allowedRoles={["Employee", "Officer", "Admin"]}>
      <EmpBallot />
    </ProtectedRoute>,
  },
  {
    path: "/employee-dashboard",
    element: <ProtectedRoute allowedRoles={["Employee"]}>
      <EmployeeDashboard />
    </ProtectedRoute>,
  },
  {
    path: "/employee-ballot",
    element: <ProtectedRoute allowedRoles={["Employee", "Officer", "Admin"]}>
      <EmpBallot />
    </ProtectedRoute>,
  },
  {
    path: "/system-stats",
    element: <ProtectedRoute allowedRoles={["Employee", "Officer", "Admin"]}>
      <SystemStats />
    </ProtectedRoute>,
  },
  {
    path: "/company-stats",
    element: <ProtectedRoute allowedRoles={["Employee", "Officer", "Admin"]}>
      <CompanyStats />
    </ProtectedRoute>,
  },
  {
    path: "/add-ballot",
    element: <ProtectedRoute allowedRoles={["Employee", "Officer", "Admin"]}>
      <AddBallot />
    </ProtectedRoute>,
  },
  {
    path: "/users-page",
    element: <ProtectedRoute allowedRoles={["Employee", "Officer", "Admin"]}>
      <UsersPage />
    </ProtectedRoute>,
  },
  {
    path: "/user-dashboard",
    element: <ProtectedRoute allowedRoles={["Member"]}>
      <UserDashboard />
    </ProtectedRoute>,
  },
  {
    path: "/user-ballot",
    element: <ProtectedRoute allowedRoles={["Member"]}>
      <UserBallot />
    </ProtectedRoute>,
  },
  {
    path: "/unauthorized",
    element: <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Unauthorized</h1>
    </div>,
  },
]);