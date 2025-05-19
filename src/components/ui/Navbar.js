import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import '../../styles/navbar.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  console.log("Navbar: Rendering with currentUser=", currentUser);

  // Force re-render when localStorage changes (in case another tab logs out)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        // Force component to re-render when token changes
        console.log("Token changed in storage, updating UI");
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = async () => {
    console.log("Navbar: Logout button clicked");
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Determine auth state from currentUser
  const isAuthenticated = !!currentUser && currentUser.isLoggedIn;
  console.log("Navbar: isAuthenticated=", isAuthenticated);

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" className="navbar-title">
          Forms Clone
        </Typography>
        
        <Box className="navbar-buttons">
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={Link} to="/forms">
                Minu Vormid
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logi Välja
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Logi Sisse
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Registreeru
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;