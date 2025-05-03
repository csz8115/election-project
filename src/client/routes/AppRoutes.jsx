import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Ballot from "../pages/Ballot";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import CreateBallot from "../pages/CreateBallot";
import EmpDashboard from "../pages/EmpDashboard";
import RoleBasedRedirect from "./RoleRedirect";
import RoleBasedRoute from "./RoleBasedRoute";
import SocietyStats from "../pages/SocietyStats";


const AppRoutes = () => {
  return (
    <Router>
      <Routes>
      <Route element={<RoleBasedRoute allowedRoles={["Admin", "Moderator"]}/>}>
          <Route path="/empDashboard" element={<EmpDashboard/>}/>
      </Route>
      <Route element={<RoleBasedRoute allowedRoles={["Admin", "Moderator"]}/>}>
          <Route path="/societyStats" element={<SocietyStats/>}/>
      </Route>
      {/* default route goes to dashboard for the appropriate role */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleBasedRedirect />} />
      </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/ballot" element={<Ballot />} />
        </Route>
        <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<ProtectedRoute />}>
        <Route path="/createBallot" element={<CreateBallot ballotID={14} />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
