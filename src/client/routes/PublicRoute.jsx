import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

// This is a wrapper component that checks if the user is logged in
// IF the user is logged in it does not render the child components
// Otherwise, it renders the child components
const PublicRoute = () => {
    const user = useSelector((state) => {
        return {
            loggedIn: state.loggedIn,
        };
    });

    return user.loggedIn ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoute;