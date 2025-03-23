import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

// This is a wrapper component that checks if the user is logged in
// If the user is logged in, it renders the child components
// Otherwise, it redirects the user to the login page
const ProtectedRoute = () => {
    const user = useSelector((state) => {
        return {
            loggedIn: state.loggedIn,
        };
    });

    return user.loggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;