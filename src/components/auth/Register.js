import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Alert,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import '../../styles/register.css';
import '../../styles/register.css';

// Parooli tugevuse valideerimise funktsioonid
const validatePassword = (password) => {
  const validations = {
    length: password.length >= 8,
    upperCase: /[A-Z]/.test(password),
    lowerCase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    specialChars: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    notCommon: !['password', 'password123', '123456', 'qwerty', 'admin', 'welcome', 'parool'].includes(password.toLowerCase())
  };
  
  // Teeme kindlaks, et vähemalt 3 keerukuse kategooriat on täidetud
  const complexityCount = [
    validations.upperCase, 
    validations.lowerCase, 
    validations.numbers, 
    validations.specialChars
  ].filter(Boolean).length;
  
  validations.complexity = complexityCount >= 3;
  
  return validations;
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    upperCase: false,
    lowerCase: false,
    numbers: false,
    specialChars: false,
    complexity: false,
    notCommon: true
  });
  
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Valideeri parool reaalajas
    const validations = validatePassword(newPassword);
    setPasswordValidation(validations);
    
    // Näita parooli kriteeriume, kui kasutaja hakkab parooli sisestama
    if (newPassword && !showPasswordCriteria) {
      setShowPasswordCriteria(true);
    } else if (!newPassword) {
      setShowPasswordCriteria(false);
    }
    
    // Kontrolli, kas parool on piisavalt tugev
    const isValid = validations.length && validations.complexity && validations.notCommon;
    
    if (!isValid && newPassword) {
      setPasswordError('Parool ei vasta turvalisuse nõuetele');
    } else {
      setPasswordError('');
    }
    
    // Kontrolli, kas paroolid kattuvad
    if (confirmPassword && newPassword !== confirmPassword) {
      setConfirmPasswordError('Paroolid ei kattu');
    } else if (confirmPassword) {
      setConfirmPasswordError('');
    }
  };
  
  const handleConfirmPasswordChange = (e) => {
    const confirmValue = e.target.value;
    setConfirmPassword(confirmValue);
    
    if (confirmValue && password !== confirmValue) {
      setConfirmPasswordError('Paroolid ei kattu');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Lähtesta veateated
    setError('');
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    
    // Valideeri väljad
    let isValid = true;
    
    if (!name) {
      setNameError('Nimi on kohustuslik');
      isValid = false;
    }
    
    if (!email) {
      setEmailError('E-posti aadress on kohustuslik');
      isValid = false;
    } else {
      // E-posti formaadi kontroll
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Sisestatud e-posti aadress ei ole korrektne');
        isValid = false;
      }
    }
    
    if (!password) {
      setPasswordError('Parool on kohustuslik');
      isValid = false;
    } else {
      // Kontrolli, kas parool on piisavalt tugev
      const validations = validatePassword(password);
      const passwordIsValid = validations.length && validations.complexity && validations.notCommon;
      
      if (!passwordIsValid) {
        setPasswordError('Parool ei vasta turvalisuse nõuetele');
        isValid = false;
      }
    }
    
    if (!confirmPassword) {
      setConfirmPasswordError('Palun kinnita parool');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Paroolid ei kattu');
      isValid = false;
    }
    
    if (!isValid) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Proovi kasutaja registreerida
      const result = await register(name, email, password);
      console.log("Registration successful:", result);
      
      // Kontrollime, et token on salvestatud
      const token = localStorage.getItem('token');
      
      if (token) {
        // Ootame veidi, et AuthContext jõuaks uuendada state'i
        setTimeout(() => {
          console.log("Navigating to /forms after successful registration");
          navigate('/forms', { replace: true });
        }, 100);
      } else {
        // Kui mingil põhjusel tokenit pole, suuname sisselogimislehele
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      // Kohandatud veateadete töötlemine olemasoleva API veaformaadiga
      // Kuna sinu API kasutab ainult 'message' välja, peame parsima veateated
      if (err.message) {
        const errorMessage = err.message.toLowerCase();
        
        // Analüüsime veateadet ja määrame õigele väljale
        if (errorMessage.includes('email')) {
          if (errorMessage.includes('exists') || errorMessage.includes('juba olemas')) {
            setEmailError('Selle e-posti aadressiga kasutaja on juba olemas');
          } else {
            setEmailError(err.message);
          }
        } else if (errorMessage.includes('password') || errorMessage.includes('parool')) {
          setPasswordError(err.message);
        } else if (errorMessage.includes('name') || errorMessage.includes('nimi')) {
          setNameError(err.message);
        } else {
          // Üldine veateade, kui ei suuda tuvastada välja
          setError(err.message);
        }
      } else {
        // Üldine veateade, kui puudub message väli
        setError('Registreerimine ebaõnnestus. Proovige uuesti.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-container">
      <Paper elevation={3} className="auth-paper">
        <Typography variant="h4" component="h1" gutterBottom className="auth-title">
          Registreerimine
        </Typography>
        
        {error && (
          <Alert severity="error" className="auth-alert">
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nimi"
            name="name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!nameError}
            helperText={nameError}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="E-posti aadress"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError}
            helperText={emailError}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Parool"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={handlePasswordChange}
            error={!!passwordError}
            helperText={passwordError}
            onFocus={() => setShowPasswordCriteria(true)}
          />
          
          {showPasswordCriteria && (
            <List dense className="password-criteria-list">
              <Typography variant="subtitle2" className="password-criteria-title">
                Parool peab vastama järgmistele nõuetele:
              </Typography>
              <ListItem>
                <ListItemIcon className="criteria-icon">
                  {passwordValidation.length ? 
                    <CheckIcon color="success" fontSize="small" /> : 
                    <CloseIcon color="error" fontSize="small" />}
                </ListItemIcon>
                <ListItemText primary="Vähemalt 8 tähemärki" />
              </ListItem>
              <ListItem>
                <ListItemIcon className="criteria-icon">
                  {passwordValidation.complexity ? 
                    <CheckIcon color="success" fontSize="small" /> : 
                    <CloseIcon color="error" fontSize="small" />}
                </ListItemIcon>
                <ListItemText 
                  primary="Sisaldab vähemalt 3 järgnevast: suurtähed, väiketähed, numbrid, erimärgid" 
                  secondary={
                    <Box className="criteria-secondary">
                      <Typography variant="body2" component="span" 
                        className={passwordValidation.upperCase ? "criteria-detail-valid" : "criteria-detail"}>
                        Suurtähed {passwordValidation.upperCase ? '✓' : ''}
                      </Typography>
                      {' • '}
                      <Typography variant="body2" component="span" 
                        className={passwordValidation.lowerCase ? "criteria-detail-valid" : "criteria-detail"}>
                        Väiketähed {passwordValidation.lowerCase ? '✓' : ''}
                      </Typography>
                      {' • '}
                      <Typography variant="body2" component="span" 
                        className={passwordValidation.numbers ? "criteria-detail-valid" : "criteria-detail"}>
                        Numbrid {passwordValidation.numbers ? '✓' : ''}
                      </Typography>
                      {' • '}
                      <Typography variant="body2" component="span" 
                        className={passwordValidation.specialChars ? "criteria-detail-valid" : "criteria-detail"}>
                        Erimärgid {passwordValidation.specialChars ? '✓' : ''}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon className="criteria-icon">
                  {passwordValidation.notCommon ? 
                    <CheckIcon color="success" fontSize="small" /> : 
                    <CloseIcon color="error" fontSize="small" />}
                </ListItemIcon>
                <ListItemText primary="Ei ole liiga tavapärane parool" />
              </ListItem>
            </List>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Kinnita parool"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            error={!!confirmPasswordError}
            helperText={confirmPasswordError}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading ? 'Registreerimine...' : 'Registreeri'}
          </Button>
          
          <Box className="auth-link-container">
            <Typography variant="body2">
              Juba on konto olemas?{' '}
              <Link href="/login" variant="body2" className="auth-link">
                Logi sisse
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;