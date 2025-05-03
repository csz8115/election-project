import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

// This is a wrapper component that checks if the users account type is allowed
// if the account type is allowed it renders the child components
// Otherwise, it navigates to the unauthorized page
 const RoleBasedRoute = ({ allowedRoles }) => {
    const user = useSelector((state) => {
        return {
            loggedIn: state.loggedIn,
            accountType: state.accountType,
        };
    });

    return user.loggedIn && allowedRoles.includes(user.accountType) ? <Outlet /> : <Navigate to="/unauthorized" />;
};

export default RoleBasedRoute;