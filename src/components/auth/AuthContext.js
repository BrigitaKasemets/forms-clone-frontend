import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../../services/auth.service';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const checkLoggedIn = async () => {
      console.log("Checking if user is logged in...");
      try {
        const user = authService.getCurrentUser();
        console.log("User from getCurrentUser:", user);
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Error in checkLoggedIn:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      console.log("Attempting login with:", email);
      const response = await authService.login(email, password);
      console.log("Login response:", response);
      
      if (!response || !response.token) {
        console.error("No token received during login.");
        throw new Error("[AUTH_INVALID_CREDENTIALS] Vale e-posti aadress või parool");
      }

      // Set the user data with all required fields
      const userData = {
        isLoggedIn: true,
        token: response.token,
        user: response.user || { email, id: response.userId }
      };
      
      console.log("Setting current user with:", userData);
      setCurrentUser(userData);
      
      console.log("Login successful, currentUser set to:", {
        isLoggedIn: true,
        token: response.token ? "exists" : "missing",
        user: userData.user
      });

      return response;
    } catch (error) {
      console.error("Login error:", error.message);
      throw error; // edasi Login komponendile
    }
  };


  const register = async (name, email, password) => {
    try {
      const response = await authService.register(email, password, name);
      console.log("Registration response:", response);
      
      // Kui vastuses on token, seame kasutaja sisselogituks
      if (response.token) {
        setCurrentUser({ 
          isLoggedIn: true,
          token: response.token,
          user: response.user || { name, email }
        });
        console.log("User logged in after registration");
      } else {
        console.warn("No token in registration response:", response);
      }
      
      return response;
    } catch (error) {
      console.error("Registration error in AuthContext:", error);
      throw error; // Viskame vea edasi, et Register komponent saaks seda püüda
    }
  };

  const logout = () => {
    try {
      console.log("Logging out user");
      authService.logout();
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    loading,
    login,
    register,
    logout
  };

  console.log("AuthProvider rendering with currentUser:", currentUser, "loading:", loading);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
export default AuthContext;