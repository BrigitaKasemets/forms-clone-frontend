import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Alert,
  Link,
  Snackbar
} from '@mui/material';
import '../../styles/login.css';

const Login = () => {
  // Kasutame localStorage initialization'it veateate jaoks, 
  // et see säiliks isegi kui komponent taasrenderdatakse
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Hoiame veateadet localStorage'is, et see ei kaoks ootamatult
  const [error, setError] = useState(() => {
    return localStorage.getItem('loginError') || '';
  });
  
  // Kõik seotud veafeldid, mis peaksid samuti püsima
  const [emailError, setEmailError] = useState(() => {
    return localStorage.getItem('loginEmailError') || '';
  });
  
  const [passwordError, setPasswordError] = useState(() => {
    return localStorage.getItem('loginPasswordError') || '';
  });
  
  // Kas kasutaja on üritanud sisse logida?
  const [attemptedLogin, setAttemptedLogin] = useState(() => {
    return localStorage.getItem('loginAttempted') === 'true';
  });
  
  // Kas tegu on autentimisveaga?
  const [hasAuthError, setHasAuthError] = useState(() => {
    return localStorage.getItem('hasAuthError') === 'true';
  });
  
  // Snackbar näitamiseks autentimisvea puhul
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  // Success message for account actions
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Abifunktsioon veateadete püsivaks tegemiseks
  const setPersistentError = (message) => {
    setError(message);
    if (message) {
      localStorage.setItem('loginError', message);
    } else {
      localStorage.removeItem('loginError');
    }
  };
  
  const setPersistentEmailError = (message) => {
    setEmailError(message);
    if (message) {
      localStorage.setItem('loginEmailError', message);
    } else {
      localStorage.removeItem('loginEmailError');
    }
  };
  
  const setPersistentPasswordError = (message) => {
    setPasswordError(message);
    if (message) {
      localStorage.setItem('loginPasswordError', message);
    } else {
      localStorage.removeItem('loginPasswordError');
    }
  };
  
  const setPersistentAttemptedLogin = (value) => {
    setAttemptedLogin(value);
    if (value) {
      localStorage.setItem('loginAttempted', 'true');
    } else {
      localStorage.removeItem('loginAttempted');
    }
  };
  
  const setPersistentHasAuthError = (value) => {
    setHasAuthError(value);
    if (value) {
      localStorage.setItem('hasAuthError', 'true');
      // Kui tegu on autentimisveaga, näitame kindlasti snackbari
      setShowSnackbar(true);
    } else {
      localStorage.removeItem('hasAuthError');
    }
  };

  // Kuna kasutame localStorage init, siis kui on juba viga, näitame kohe Snackbari
  useEffect(() => {
    if (hasAuthError) {
      setShowSnackbar(true);
    }
    
    // Check for messages in location state (like account deletion)
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setShowSuccessMessage(true);
      
      // Clear location state to prevent showing the message after refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
    
    // DEBUGGING
    console.log('Login komponent renderdatud, error:', error, 'hasAuthError:', hasAuthError);
  }, [error, hasAuthError, location, navigate]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    
    // Me ei eemalda autentimisviga automaatselt, kui kasutaja muudab e-posti
    // See on teadlik otsus, et veateade jääks nähtavaks kuni kasutaja selgelt puhastab vormi
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    
    // Me ei eemalda autentimisviga automaatselt, kui kasutaja muudab parooli
    // See on teadlik otsus, et veateade jääks nähtavaks kuni kasutaja selgelt puhastab vormi
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Märgime, et kasutaja on üritanud sisse logida
    setPersistentAttemptedLogin(true);
    
    try {
      setLoading(true);
      
      // Valideerimine
      if (!email) {
        setPersistentEmailError('E-posti aadress on kohustuslik');
        setPersistentError('E-posti aadress on kohustuslik');
        setLoading(false);
        return;
      }
      
      if (!password) {
        setPersistentPasswordError('Parool on kohustuslik');
        setPersistentError('Parool on kohustuslik');
        setLoading(false);
        return;
      }
      
      // Proovime kasutaja sisse logida
      const result = await login(email, password);
      console.log("Login successful:", result);
      
      // Kui login õnnestus, siis kustutame kõik veateated
      clearAllErrors();
      
      // Kontrollime, et token on salvestatud localStorage'i
      const token = localStorage.getItem('token');
      console.log("Token in localStorage after login:", !!token);
      
      if (token) {
        // Navigeerime edasi
        setTimeout(() => {
          navigate('/forms', { replace: true });
        }, 100);
      } else {
        setPersistentError('Sisselogimine ebaõnnestus: Puudub autentimistoken');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error in component:', err);
      
      // Ensure we have an error message even if err.message is undefined
      const errorMessage = err.message || 'Sisselogimine ebaõnnestus. Proovige uuesti.';
      
      console.error('Login error details:', errorMessage);
      
      // Check for our special marker or other indicators of invalid credentials
      if (errorMessage.includes('[AUTH_INVALID_CREDENTIALS]') || 
          errorMessage.toLowerCase().includes('credentials') || 
          errorMessage.toLowerCase().includes('vale') ||
          errorMessage.toLowerCase().includes('invalid')) {
        
        // Vale parool/kasutaja - seadistame püsivad veateated
        const errorMsg = 'Vale e-posti aadress või parool! Kontrollige sisestatud andmeid ja proovige uuesti.';
        
        // Seadistame kõik veateated püsivalt
        setPersistentEmailError(errorMsg);
        setPersistentPasswordError(errorMsg);
        setPersistentError(errorMsg);
        
        // Märgime, et tegemist on autentimisveaga ja näitame Snackbari
        setPersistentHasAuthError(true);
        setShowSnackbar(true);
      } else if (errorMessage.toLowerCase().includes('email')) {
        setPersistentEmailError(errorMessage);
        setPersistentError(errorMessage);
      } else if (errorMessage.toLowerCase().includes('password') || 
                errorMessage.toLowerCase().includes('parool')) {
        setPersistentPasswordError(errorMessage);
        setPersistentError(errorMessage);
      } else {
        // Generic error
        setPersistentError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearAllErrors = () => {
    setPersistentError('');
    setPersistentEmailError('');
    setPersistentPasswordError('');
    setPersistentHasAuthError(false);
    setShowSnackbar(false);
  };

  const clearForm = () => {
    console.log("Vorm puhastatakse kasutaja nõudmisel");
    setEmail('');
    setPassword('');
    
    // Kasutame püsivate veateadete puhastamiseks meie funktsioone
    setPersistentError('');
    setPersistentEmailError('');
    setPersistentPasswordError('');
    setPersistentAttemptedLogin(false);
    setPersistentHasAuthError(false);
    
    setShowSnackbar(false);
  };

  // Funktstioon Snackbari sulgemiseks
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return; // Ei sulge Snackbari klõpsu peale mujale
    }
    setShowSnackbar(false);
  };

  return (
    <Box className="auth-container">
      <Paper elevation={3} className="auth-paper">
        <Typography variant="h4" component="h1" gutterBottom className="auth-title">
          Logi sisse
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            className={`auth-alert ${hasAuthError ? 'persistent-error' : ''}`}
            sx={{ 
              marginBottom: 2, 
              padding: 2,
              fontWeight: 'bold',
              border: hasAuthError ? '2px solid #f44336' : '1px solid #f44336',
              boxShadow: hasAuthError ? '0 0 10px rgba(244, 67, 54, 0.5)' : 'none',
              fontSize: '1rem'
            }}
            variant={hasAuthError ? "filled" : "standard"}
          >
            {hasAuthError ? "⚠️ " + error : error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="E-posti aadress"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={handleEmailChange}
            error={!!emailError}
            helperText={emailError}
            disabled={loading}
            FormHelperTextProps={{ 
              sx: { fontWeight: !!emailError ? 'bold' : 'normal' } 
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Parool"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={handlePasswordChange}
            error={!!passwordError}
            helperText={passwordError}
            disabled={loading}
            FormHelperTextProps={{ 
              sx: { fontWeight: !!passwordError ? 'bold' : 'normal' } 
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="auth-submit-button"
            disabled={loading}
            sx={{ mt: 2, mb: 2 }}
          >
            {loading ? 'Sisselogimine...' : 'Logi sisse'}
          </Button>
          
          {/* Näitame puhasta nupu kohe pärast sisselogimise nuppu, kui viga on ilmnenud */}
          {(hasAuthError || attemptedLogin) && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              className="auth-clear-button"
              onClick={clearForm}
              sx={{ mb: 2 }}
            >
              Puhasta vorm ja veateated
            </Button>
          )}
          
          <Box className="auth-link-container">
            <Typography variant="body2">
              Pole veel kontot?{' '}
              <Link href="/register" variant="body2" className="auth-link">
                Registreeru
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Lisame ka Snackbari, mis näitab veateadet püsivalt */}
      <Snackbar
        open={showSnackbar && hasAuthError}
        autoHideDuration={null} // Ei sule automaatselt
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          marginTop: 2,
          '& .MuiSnackbarContent-root': {
            backgroundColor: '#d32f2f',
            color: 'white',
            fontWeight: 'bold',
            padding: 2
          }
        }}
        message={`⚠️ ${error}`}
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={handleSnackbarClose}
          >
            SULGE
          </Button>
        }
      />
      
      {/* Success message snackbar */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          marginTop: 2,
          '& .MuiSnackbarContent-root': {
            backgroundColor: '#4caf50',
            color: 'white',
            fontWeight: 'bold',
            padding: 2
          }
        }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;