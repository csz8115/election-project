import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../store/userSlice";
import ErrorMessage from './ErrorMessage.jsx';
export const Logout = () => {
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const logoutUser = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/logout', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });
      if (response.ok) {
        // Dispatch a plain action to update the Redux state after successful logout
        dispatch(logout());
        navigate('/login');
      } else if (response.status === 401) {
        console.error('User not logged in');
        setError("User not logged in");
      } else {
        console.error('Logout failed', response);
        setError("Logout failed");
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setError("Logout failed");
    }
  };

  return (
    <div>
      {error && (
        <ErrorMessage message={error}></ErrorMessage>
      )}
      <button
        onClick={logoutUser}
        className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition duration-300"
      >
        Logout
      </button>
    </div>
  );
};

export default Logout;
