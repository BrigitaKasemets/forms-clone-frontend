import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import UserService from '../../services/user.service';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Snackbar,
  Divider,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import '../../styles/profile.css';

const ProfilePage = () => {
  const { currentUser, setCurrentUser } = useAuth();
  
  const [userData, setUserData] = useState({
    name: '',
    email: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoadingMessage, setPasswordLoadingMessage] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  useEffect(() => {
    // Fetch current user data
    const fetchUserData = async () => {
      try {
        if (!currentUser) {
          setError('Kasutaja andmeid ei leitud. Palun logige uuesti sisse.');
          setLoading(false);
          return;
        }
        
        // Try to get user data from API first
        try {
          console.log('Fetching current user data from API...');
          const user = await UserService.getUserById('me');
          
          setUserData({
            name: user.name || '',
            email: user.email || '',
          });
          
          console.log('User data fetched successfully:', user);
        } catch (err) {
          console.error('Error fetching user from API:', err);
          
          // Fallback to local data
          if (currentUser.user) {
            console.log('Using user data from AuthContext:', currentUser.user);
            setUserData({
              name: currentUser.user.name || '',
              email: currentUser.user.email || '',
            });
          } else {
            // Try from localStorage as last resort
            try {
              const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
              console.log('Using user data from localStorage:', storedUser);
              
              if (storedUser && (storedUser.name || storedUser.email)) {
                setUserData({
                  name: storedUser.name || '',
                  email: storedUser.email || ''
                });
              } else {
                setError('Kasutaja andmeid ei leitud. Palun logige uuesti sisse.');
              }
            } catch (storageErr) {
              console.error('Error parsing user from localStorage:', storageErr);
              setError('Kasutaja andmeid ei leitud. Palun logige uuesti sisse.');
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        setError('Viga kasutaja andmete laadimisel. Palun proovige uuesti.');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Updating user data:', userData);
      
      // Saadame PATCH päringusse nii nime kui e-posti
      const response = await UserService.updateUser('me', userData);

      // Response on edukalt tagastatud objekt, mitte success flag
      setSuccess('Kasutaja andmed edukalt uuendatud.');
      setCurrentUser({ ...currentUser, user: response });
    } catch (err) {
      console.error('Error updating user data:', err);
      setError('Viga kasutaja andmete uuendamisel.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };
  
  const handlePasswordDialogOpen = () => {
    // Reset password fields and errors before opening dialog
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setPasswordLoadingMessage('');
    setOpenPasswordDialog(true);
  };
  
  const handlePasswordDialogClose = () => {
    setOpenPasswordDialog(false);
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setPasswordError('');
      
      // Basic validation
      if (!passwordData.currentPassword) {
        setPasswordError('Praegune parool on kohustuslik');
        return;
      }
      
      if (!passwordData.newPassword) {
        setPasswordError('Uus parool on kohustuslik');
        return;
      }
      
      if (passwordData.newPassword.length < 8) {
        setPasswordError('Uus parool peab olema vähemalt 8 tähemärki pikk');
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('Paroolid ei ühti');
        return;
      }
      
      // Kontrollime, et uus parool ei oleks sama mis vana
      if (passwordData.currentPassword === passwordData.newPassword) {
        setPasswordError('Uus parool ei või olla sama mis vana parool');
        return;
      }
      
      // Kuvame kasutajale, et toimub parooli muutmine
      setLoading(true);
      setPasswordError(''); // Tühjendame varem esinenud vead
      setPasswordLoadingMessage('Parooli muutmine on käimas, palun oodake...');
      
      console.log('Saadame parooli muutmise päringu serverile...');
      
      try {
        const result = await UserService.changePassword('me', {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
        
        console.log('Parooli muutmise vastus serverilt:', result);
        
        // Uuendatud vastus sisaldab success välja
        if (result && result.success) {
          // Suleme dialoogi enne staatuse muutmist, et vältida visuaalseid probleeme
          handlePasswordDialogClose();
          
          // Tühjendame vead ja näitame eduka muutmise teadet
          setPasswordError('');
          setPasswordLoadingMessage('');
          setSuccess('Parool on edukalt muudetud! Palun logi uue parooliga sisse.');
          
          // Logime kasutaja välja ja suuname sisselogimislehele
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }, 2000);
        } else {
          // Kui vastuses pole success true, siis miski läks valesti
          setPasswordLoadingMessage('');
          setPasswordError('Parooli muutmine ebaõnnestus. Proovi uuesti.');
        }
      } catch (apiError) {
        console.error('API Error changing password:', apiError);
        setPasswordLoadingMessage('');
        setPasswordError(apiError.message || 'Viga parooli muutmisel serveri poolel');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordLoadingMessage('');
      setPasswordError(err.message || 'Viga parooli muutmisel');
    } finally {
      setLoading(false);
    }
  };

  // Handler for opening delete account dialog
  const handleDeleteDialogOpen = () => {
    setDeleteError('');
    setOpenDeleteDialog(true);
  };

  // Handler for closing delete account dialog
  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
  };

  // Handler for deleting user account
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setDeleteError('');
      
      console.log('Attempting to delete user account...');
      
      const result = await UserService.deleteUser('me');
      
      console.log('Account deletion response:', result);
      
      // Close dialog and show success message
      handleDeleteDialogClose();
      setSuccess('Konto on edukalt kustutatud. Teid suunatakse peatselt avalehele.');
      
      // Log user out and redirect to login page
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      console.error('Error deleting account:', err);
      setDeleteError(err.message || 'Viga konto kustutamisel.');
      setLoading(false);
    }
  };
  
  return (
    <Container className="profile-container">
      <Paper elevation={3} className="profile-paper">
        <Typography variant="h4" gutterBottom>Profiil</Typography>
        
        <form onSubmit={handleSubmit} className="profile-form">
          <Grid container spacing={3} columns={12}>
            <Grid
              sx={{
                gridColumn: 'span 12',
                width: '100%',
                mb: 2,
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                name="name"
                label="Nimi"
                value={userData.name}
                onChange={handleChange}
              />
          </Grid>

  <Grid
    sx={{
      gridColumn: 'span 12',
      width: '100%',
      mb: 2,
    }}
  >
    <TextField
      fullWidth
      variant="outlined"
      name="email"
      label="E-post"
      type="email"
      value={userData.email}
      onChange={handleChange}
    />
  </Grid>

  <Grid
    sx={{
      gridColumn: 'span 12',
      width: '100%',
    }}
  >
    <Button 
      type="submit" 
      variant="contained" 
      color="primary"
      disabled={loading}
    >
      Salvesta
    </Button>
  </Grid>
</Grid>
        </form>
        
        <Divider style={{ margin: '30px 0' }} />
        
        <Typography variant="h5" gutterBottom>Parooli muutmine</Typography>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={handlePasswordDialogOpen}
        >
          Muuda parooli
        </Button>
        
        <Divider style={{ margin: '30px 0' }} />
        
        <Typography variant="h5" gutterBottom>Konto kustutamine</Typography>
        <Box>
          <Typography variant="body1" style={{ marginBottom: '15px' }}>
            Konto kustutamine on pöördumatu toiming. Kõik teie andmed kustutatakse jäädavalt.
          </Typography>
          <Button 
            variant="outlined" 
            color="error"
            onClick={handleDeleteDialogOpen}
          >
            Kustuta konto
          </Button>
        </Box>
        
        {/* Password Change Dialog */}
        <Dialog 
          open={openPasswordDialog} 
          onClose={handlePasswordDialogClose}
          aria-labelledby="password-dialog-title"
          aria-describedby="password-dialog-description"
        >
          <DialogTitle id="password-dialog-title">Parooli muutmine</DialogTitle>
          <DialogContent>
            <DialogContentText id="password-dialog-description">
              Parooli muutmiseks sisesta praegune parool ja seejärel uus parool kaks korda.
            </DialogContentText>
            <Box component="form" onSubmit={handlePasswordSubmit} sx={{ mt: 2 }}>
              {passwordLoadingMessage && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {passwordLoadingMessage}
                </Alert>
              )}
              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {passwordError}
                </Alert>
              )}
              <TextField
                fullWidth
                margin="dense"
                name="currentPassword"
                label="Praegune parool"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                variant="outlined"
                autoFocus
              />
              <TextField
                fullWidth
                margin="dense"
                name="newPassword"
                label="Uus parool"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                name="confirmPassword"
                label="Kinnita uus parool"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                variant="outlined"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePasswordDialogClose} disabled={loading}>Tühista</Button>
            <Button 
              onClick={handlePasswordSubmit} 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? 'Muudan...' : 'Muuda parool'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete Account Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={handleDeleteDialogClose}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">Konto kustutamine</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Olete kindel, et soovite oma konto kustutada? See toiming on pöördumatu ning kõik teie andmed kustutatakse jäädavalt.
            </DialogContentText>
            {deleteError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {deleteError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteDialogClose} disabled={loading}>Tühista</Button>
            <Button 
              onClick={handleDeleteAccount}
              variant="contained" 
              color="error"
              disabled={loading}
            >
              {loading ? 'Kustutan...' : 'Kustuta konto'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Success message snackbar */}
        <Snackbar 
          open={!!success} 
          autoHideDuration={6000} 
          onClose={() => setSuccess('')}
        >
          <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
        
        {/* Error message snackbar */}
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError('')}
        >
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
