import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../store/userSlice.ts";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/Utils/ErrorMessage.jsx";
const baseUrl = import.meta.env.VITE_API_BASE;


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();


  const handleSubmit = async (event) => {
    event.preventDefault();
    // get API URL from environment variable
    const response = await fetch(`${baseUrl}/api/v1/member/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include", // This is the correct way to include credentials
    });
    if (response && response.ok) {
      const res = await response.json(); // Process response if needed
      dispatch(
        login({
          userID: res.data.userID,
          username: res.data.username,
          accountType: res.data.accountType,
          fName: res.data.fName,
          lName: res.data.lName,
          companyID: res.data.companyID,
          companyName: res.data.companyName,
        })
      );
      //redirects to dashboards based on role
      const accountType = res.data.accountType;
      if(accountType === "Admin" || accountType === "Moderator"){
        console.log("adminLogin");
        navigate("/empDashboard", { replace: true });
      }else{
        console.log("memberLogin");
        navigate("/dashboard");
      }
    } else {
      console.error("Login failed");
      console.log(response);
      setError(response.json().error || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">

      <form
        onSubmit={handleSubmit}
        className="p-8 bg-white rounded-lg shadow-md w-96"
      >
      {error && (
        <ErrorMessage message={error}></ErrorMessage>
      )}
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Login
        </h1>
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Username:
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Password:
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Login
        </button>
      </form>
    </div>
  );
}
