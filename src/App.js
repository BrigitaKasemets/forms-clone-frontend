import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProfilePage from './components/user/ProfilePage';
import Layout from './components/ui/Layout';
import PrivateRoute from './components/ui/PrivateRoute';

// Forms components
import FormsList from './components/forms/FormsList';
import FormEdit from './components/forms/FormEdit';
import FormView from './components/forms/FormView';
import FormResponses from './components/forms/FormResponses';

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
              {/* Form routes */}
              <Route path="/forms" element={<FormsList />} />
              <Route path="/forms/:formId" element={<FormView />} />
              <Route path="/forms/:formId/edit" element={<FormEdit />} />
              <Route path="/forms/:formId/responses" element={<FormResponses />} />
              
              <Route path="/profile" element={<ProfilePage />} />
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