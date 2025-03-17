import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Homepage from "../pages/Homepage";


const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />

        <Route path="/homepage" element={<Homepage />} />

      </Routes>
    </Router>
  );
};

export default AppRoutes;