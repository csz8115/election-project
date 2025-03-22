import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/userSlice.ts";


export const Logout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const logoutUser = async () => {
    try {
        const response = await fetch('http://localhost:3000/user/logout', {
          method: 'POST',
          credentials: 'include',
        });
        if (response.ok) {
          // Dispatch a plain action to update the Redux state after successful logout
          dispatch(logout());
          navigate('/login');
        } else {
          console.error('Logout failed');
        }
      } catch (error) {
        console.error('Error during logout:', error);
      }
    };

  return (
    <button
      onClick={logoutUser}
      className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition duration-300"
    >
      Logout
    </button>
  );
};
export default Logout;
