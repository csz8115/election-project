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

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
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
