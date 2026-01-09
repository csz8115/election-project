import { Outlet } from "react-router-dom";
import Navbar from "../components/nav/navbar";
import SubHeader from "../components/nav/subNavbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <Navbar />
      <SubHeader />
      <main className="min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  );
}
