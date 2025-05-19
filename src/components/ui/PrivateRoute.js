import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { CircularProgress } from '@mui/material';
import '../../styles/private-route.css';

const PrivateRoute = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  console.log("PrivateRoute: currentUser=", currentUser, "loading=", loading);
  console.log("PrivateRoute: Current location=", location.pathname);
  
  // Kontrollime otse localStorage'ist, kas token on olemas
  const hasToken = !!localStorage.getItem('token');
  console.log("PrivateRoute: Token in localStorage=", hasToken);

  if (loading) {
    console.log("PrivateRoute: Still loading, showing loading indicator");
    return (
      <div className="loading-container">
        <CircularProgress className="loading-spinner" />
      </div>
    );
  }

  // Kui token on olemas, lubame ligipääsu isegi kui currentUser pole veel laaditud
  if (hasToken || currentUser) {
    console.log("PrivateRoute: Access granted, token or user exists");
    return <Outlet />;
  }

  console.log("PrivateRoute: Access denied, redirecting to login");
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;
