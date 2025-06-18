import {
  createBrowserRouter,
} from "react-router-dom";
import Login from "./login";
import Dashboard from "./dashboard";
import Ballot from "./ballot";

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
    path: "/ballot",
    element: <Ballot />,
  }
]);