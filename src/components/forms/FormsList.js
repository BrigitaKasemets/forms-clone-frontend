import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReplyIcon from '@mui/icons-material/Reply';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FormsService from '../../services/forms.service';
import { useAuth } from '../auth/AuthContext';

const FormsList = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Tab for My Forms / Available Forms
  const [tabValue, setTabValue] = useState(0);
  
  // New form dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', description: '' });
  const [formErrors, setFormErrors] = useState({ title: '', description: '' });
  
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  useEffect(() => {
    console.log('useEffect triggered with currentUser:', 
                 currentUser ? 
                 `ID: ${currentUser.user?.id}, isLoggedIn: ${currentUser.isLoggedIn}` : 
                 'null');
    
    // Reset loading state when user changes 
    setLoading(true);
    
    // Wait a moment to ensure AuthContext is fully updated
    const timer = setTimeout(() => {
      fetchForms();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentUser]); // Lisame currentUser sõltuvuseks, et vormid laaditaks uuesti, kui kasutaja muutub
  
  // Kontrollime, kas tulime siia mõne muu lehe navigeerimisest ja 
  // kas meil on kaasas soovitud tab'i info
  useEffect(() => {
    if (location.state && typeof location.state.activeTab !== 'undefined') {
      console.log('Seadistan aktiivse tabi location state põhjal:', location.state.activeTab);
      setTabValue(location.state.activeTab);
    }
  }, [location.state]);

  const fetchForms = async () => {
    try {
      console.log('fetchForms käivitatud. Kasutaja info:', currentUser);
      
      // Kui oleme vormide lehe külastanud kohe pärast sisselogimist ja
      // kasutaja andmed veel puuduvad, ootame natuke enne laadimist
      if (!currentUser || !currentUser.user || !currentUser.user.id) {
        console.log('Kasutaja andmed pole veel täielikult laaditud, ootame...');
        // Kui soovid, võid siin lisada viivituse ja siis uuesti proovida
      }
      
      setLoading(true);
      const data = await FormsService.getAllForms();
      console.log('Fetched forms:', data);
      // Log the structure of each form to check the userId
      data.forEach(form => {
        console.log(`Form ${form.id}: userId=${form.userId}, title=${form.title}`);
      });
      console.log('Current user for filtering:', currentUser);
      setForms(data);
      setError('');
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError('Vormide laadimine ebaõnnestus. Proovige hiljem uuesti.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDialogOpen = () => {
    setNewForm({ title: '', description: '' });
    setFormErrors({ title: '', description: '' });
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = { title: '', description: '' };
    let isValid = true;
    
    if (!newForm.title.trim()) {
      errors.title = 'Pealkiri on kohustuslik';
      isValid = false;
    }
    
    // Description is optional but can have validation if needed
    
    setFormErrors(errors);
    return isValid;
  };

  const handleCreateForm = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Ensure the form is associated with the current user
      const formData = {
        ...newForm,
        userId: currentUser?.user?.id
      };
      
      console.log('Creating form with data:', formData);
      console.log('Current user from context:', currentUser);
      const createdForm = await FormsService.createForm(formData);
      console.log('Form created, response from server:', createdForm);
      
      // Add the new form to the list with the correct userId
      const formWithUserId = {
        ...createdForm,
        userId: currentUser?.user?.id
      };
      
      setForms(prev => [formWithUserId, ...prev]);
      
      // Close dialog and show success message
      handleDialogClose();
      setSuccess('Vorm on edukalt loodud!');
      
      // Navigate to edit page
      setTimeout(() => {
        navigate(`/forms/${createdForm.id}/edit`);
      }, 1000);
    } catch (err) {
      console.error('Error creating form:', err);
      setError('Vormi loomine ebaõnnestus. Proovige hiljem uuesti.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (form) => {
    setFormToDelete(form);
    setDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialog(false);
    setFormToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return;
    
    try {
      setLoading(true);
      await FormsService.deleteForm(formToDelete.id);
      
      // Remove the deleted form from the list
      setForms(prev => prev.filter(form => form.id !== formToDelete.id));
      
      // Close dialog and show success message
      setDeleteDialog(false);
      setFormToDelete(null);
      setSuccess('Vorm on edukalt kustutatud!');
    } catch (err) {
      console.error('Error deleting form:', err);
      setError('Vormi kustutamine ebaõnnestus. Proovige hiljem uuesti.');
    } finally {
      setLoading(false);
    }
  };

  // Filter forms based on ownership
  const myForms = forms.filter(form => {
    // Kui vorm või userId puudub, siis ei kuulu see kindlasti praegusele kasutajale
    if (!form || !form.userId) {
      console.log(`Form ${form?.id || 'unknown'}: skipping because userId is missing`);
      return false;
    }
    
    // Kui kasutaja pole sisselogitud või kasutaja ID puudub, siis vorm ei kuulu talle
    if (!currentUser || !currentUser.user || !currentUser.user.id) {
      console.log(`Form ${form.id}: skipping because user is not logged in or user.id is missing`);
      return false;
    }
    
    // Teisendame ID-d stringideks võrdlemiseks, et vältida tüübiprobleeme
    const formUserId = String(form.userId);
    const currentUserId = String(currentUser.user.id);
    
    console.log(`Comparing form ${form.id}: formUserId=${formUserId} with currentUserId=${currentUserId}`);
    const isMatch = formUserId === currentUserId;
    console.log(`Form ${form.id} belongs to current user: ${isMatch}`);
    
    return isMatch;
  });
  
  const otherForms = forms.filter(form => {
    // Kui vorm või userId puudub, siis ei saa me kindlaks teha, kellele see kuulub
    if (!form || !form.userId) return false;
    
    // Kui kasutaja pole sisselogitud, kuuluvad kõik vormid "teistele"
    if (!currentUser || !currentUser.user || !currentUser.user.id) return true;
    
    // Teisendame ID-d stringideks võrdlemiseks
    const formUserId = String(form.userId);
    const currentUserId = String(currentUser.user.id);
    
    return formUserId !== currentUserId;
  });

  // Renderdame laadimise indikaatori kui vormid on laadimisel
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="body1" mt={2} fontWeight="medium">
          Vormide laadimine...
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          {currentUser?.isLoggedIn 
            ? "Teie vormide info laadimine" 
            : "Kõikide saadaolevate vormide laadimine"}
        </Typography>
      </Container>
    );
  }
  
  console.log('Rendering FormsList with:', {
    totalForms: forms.length,
    myForms: myForms.length,
    otherForms: otherForms.length,
    tabValue,
    isUserLoggedIn: !!currentUser?.isLoggedIn
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Vormid
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleDialogOpen}
        >
          Loo uus vorm
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label={`Minu vormid (${myForms.length})`} />
          <Tab label={`Saadaval vormid (${otherForms.length})`} />
        </Tabs>
      </Paper>
      
      {/* My Forms Tab */}
      {tabValue === 0 && (
        <>
          {myForms.length === 0 ? (
            <Box textAlign="center" mt={4}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Sul pole veel ühtegi vormi
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleDialogOpen}
                sx={{ mt: 2 }}
              >
                Loo oma esimene vorm
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {myForms.map(form => (
                <Grid item xs={12} sm={6} md={4} key={form.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" component="h2" gutterBottom noWrap>
                        {form.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" 
                        sx={{ 
                          mb: 2, 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          height: '40px'
                        }}
                      >
                        {form.description || 'Kirjeldus puudub'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Loodud: {new Date(form.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Viimati muudetud: {new Date(form.updatedAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => navigate(`/forms/${form.id}`)}
                        title="Vaata"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => navigate(`/forms/${form.id}/edit`)}
                        title="Muuda"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => navigate(`/forms/${form.id}/responses`)}
                        title="Vaata vastuseid"
                      >
                        <AssessmentIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteClick(form)}
                        title="Kustuta"
                        sx={{ ml: 'auto' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      
      {/* Available Forms Tab */}
      {tabValue === 1 && (
        <>
          {otherForms.length === 0 ? (
            <Box textAlign="center" mt={4}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Pole saadaval vorme
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {otherForms.map(form => (
                <Grid item xs={12} sm={6} md={4} key={form.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" component="h2" gutterBottom noWrap>
                        {form.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" 
                        sx={{ 
                          mb: 2, 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          height: '40px'
                        }}
                      >
                        {form.description || 'Kirjeldus puudub'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Loodud: {new Date(form.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        color="primary"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/forms/${form.id}`)}
                      >
                        Vaata
                      </Button>
                      <Button 
                        size="small" 
                        color="primary"
                        startIcon={<ReplyIcon />}
                        onClick={() => navigate(`/forms/${form.id}`)}
                      >
                        Vasta
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      
      {/* New Form Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Loo uus vorm</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Palun sisesta oma uue vormi pealkiri ja kirjeldus.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Pealkiri"
            type="text"
            fullWidth
            variant="outlined"
            value={newForm.title}
            onChange={handleInputChange}
            error={!!formErrors.title}
            helperText={formErrors.title}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Kirjeldus"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newForm.description}
            onChange={handleInputChange}
            error={!!formErrors.description}
            helperText={formErrors.description}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>Tühista</Button>
          <Button 
            onClick={handleCreateForm} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? 'Loon...' : 'Loo vorm'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Kinnita kustutamine</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Kas olete kindel, et soovite kustutada vormi "{formToDelete?.title}"? 
            See toiming on pöördumatu.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={loading}>Tühista</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? 'Kustutan...' : 'Kustuta vorm'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Message */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
      
      {/* Error Message */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FormsList;