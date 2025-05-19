import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Layout from './components/ui/Layout';
import PrivateRoute from './components/ui/PrivateRoute';

function App() {
  console.log("App component rendering");
  
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/forms" element={<div>Vormide leht</div>} />
              {/* Add more protected routes here */}
            </Route>
            
            {/* Redirect from homepage to forms page */}
            <Route path="/" element={<Navigate to="/forms" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;