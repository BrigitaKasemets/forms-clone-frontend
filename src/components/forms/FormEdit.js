import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
  Tooltip,
  InputAdornment,
  Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormsService from '../../services/forms.service';
import QuestionsService from '../../services/questions.service';
import { useAuth } from '../auth/AuthContext';

const FormEdit = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [form, setForm] = useState({ title: '', description: '' });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Question dialog state
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    type: 'shorttext',
    required: false,
    options: []
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [newOption, setNewOption] = useState('');
  const [questionErrors, setQuestionErrors] = useState({ text: '' });
  
  // Delete question dialog state
  const [deleteQuestionDialog, setDeleteQuestionDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  useEffect(() => {
    // Fetch form details and questions
    const fetchFormData = async () => {
      try {
        setLoading(true);
        
        // Fetch form details
        const formData = await FormsService.getFormById(formId);
        setForm(formData);
        
        // Verify form ownership
        if (currentUser && currentUser.user && formData.userId !== currentUser.user.id) {
          navigate('/forms', { state: { activeTab: 0 } });
          return;
        }
        
        // Fetch form questions
        const questionsData = await QuestionsService.getQuestions(formId);
        setQuestions(questionsData);
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Vormi andmete laadimine ebaõnnestus. Proovige hiljem uuesti.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormData();
  }, [formId, currentUser, navigate]);
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFormSubmit = async () => {
    try {
      setSaving(true);
      
      // Valideerime vormi andmed
      if (!form.title.trim()) {
        setError('Vormi pealkiri on kohustuslik!');
        setSaving(false);
        return;
      }
      
      const updatedForm = await FormsService.updateForm(formId, form);
      setForm(updatedForm);
      setSuccess('Vorm on edukalt salvestatud!');
    } catch (err) {
      console.error('Error updating form:', err);
      setError('Vormi salvestamine ebaõnnestus. Proovige hiljem uuesti.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleQuestionDialogOpen = (question = null, index = -1) => {
    if (question) {
      // Editing existing question
      setCurrentQuestion({
        ...question,
        options: question.options || []
      });
      setEditingQuestionIndex(index);
    } else {
      // Adding new question
      setCurrentQuestion({
        text: '',
        type: 'shorttext',
        required: false,
        options: []
      });
      setEditingQuestionIndex(-1);
    }
    
    setQuestionErrors({ text: '' });
    setNewOption('');
    setOpenQuestionDialog(true);
  };
  
  const handleQuestionDialogClose = () => {
    setOpenQuestionDialog(false);
  };
  
  const handleQuestionChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'required' ? checked : value;
    
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user types
    if (name === 'text' && questionErrors.text) {
      setQuestionErrors(prev => ({
        ...prev,
        text: ''
      }));
    }
    
    // Reset options when changing question type
    if (name === 'type') {
      if (['multiplechoice', 'checkbox', 'dropdown'].includes(value)) {
        if (currentQuestion.options.length === 0) {
          setCurrentQuestion(prev => ({
            ...prev,
            options: ['Valik 1'] // Anname kohe vähemalt ühe valiku
          }));
        }
      }
    }
  };
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };
  
  const handleAddOption = () => {
    if (!newOption.trim()) return;
    
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }));
    
    setNewOption('');
  };
  
  const handleRemoveOption = (index) => {
    const newOptions = [...currentQuestion.options];
    newOptions.splice(index, 1);
    
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };
  
  const validateQuestion = () => {
    const errors = { text: '' };
    let isValid = true;
    
    if (!currentQuestion.text.trim()) {
      errors.text = 'Küsimuse tekst on kohustuslik';
      isValid = false;
    }
    
    // Validate options for multiple choice, checkbox, and dropdown
    if (['multiplechoice', 'checkbox', 'dropdown'].includes(currentQuestion.type)) {
      if (currentQuestion.options.length === 0) {
        errors.text = 'Vähemalt üks valik on kohustuslik';
        isValid = false;
      }
    }
    
    setQuestionErrors(errors);
    return isValid;
  };
  
  const handleSaveQuestion = async () => {
    if (!validateQuestion()) return;
    
    try {
      setSaving(true);
      
      if (editingQuestionIndex >= 0) {
        // Update existing question
        const updatedQuestion = await QuestionsService.updateQuestion(
          formId,
          questions[editingQuestionIndex].id,
          currentQuestion
        );
        
        // Update questions array
        const newQuestions = [...questions];
        newQuestions[editingQuestionIndex] = updatedQuestion;
        setQuestions(newQuestions);
      } else {
        // Create new question
        const newQuestion = await QuestionsService.createQuestion(formId, currentQuestion);
        
        // Add to questions array
        setQuestions(prev => [...prev, newQuestion]);
      }
      
      // Close dialog and show success message
      handleQuestionDialogClose();
      setSuccess(editingQuestionIndex >= 0 ? 'Küsimus on edukalt uuendatud!' : 'Küsimus on edukalt lisatud!');
    } catch (err) {
      console.error('Error saving question:', err);
      setError('Küsimuse salvestamine ebaõnnestus. Proovige hiljem uuesti.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteQuestionClick = (question, index) => {
    setQuestionToDelete({ question, index });
    setDeleteQuestionDialog(true);
  };
  
  const handleDeleteQuestionCancel = () => {
    setDeleteQuestionDialog(false);
    setQuestionToDelete(null);
  };
  
  const handleDeleteQuestionConfirm = async () => {
    if (!questionToDelete) return;
    
    try {
      setSaving(true);
      await QuestionsService.deleteQuestion(formId, questionToDelete.question.id);
      
      // Remove the deleted question from the list
      setQuestions(prev => prev.filter((_, index) => index !== questionToDelete.index));
      
      // Close dialog and show success message
      setDeleteQuestionDialog(false);
      setQuestionToDelete(null);
      setSuccess('Küsimus on edukalt kustutatud!');
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Küsimuse kustutamine ebaõnnestus. Proovige hiljem uuesti.');
    } finally {
      setSaving(false);
    }
  };
  
  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'shorttext': return 'Lühivastus';
      case 'paragraph': return 'Lõik';
      case 'multiplechoice': return 'Valikvastus';
      case 'checkbox': return 'Märkeruut';
      case 'dropdown': return 'Rippmenüü';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton color="primary" onClick={() => navigate('/forms', { state: { activeTab: 0 } })} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Muuda vormi
          </Typography>
        </Box>
        
        <Box>
          <IconButton 
            color="primary" 
            onClick={() => navigate(`/forms/${formId}`)}
            title="Vaata vormi"
            sx={{ mr: 1 }}
          >
            <VisibilityIcon />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleFormSubmit}
            disabled={saving}
          >
            {saving ? 'Salvestan...' : 'Salvesta vorm'}
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Vormi informatsioon
        </Typography>
        
        <TextField
          fullWidth
          margin="normal"
          label="Pealkiri"
          name="title"
          value={form.title}
          onChange={handleFormChange}
          variant="outlined"
          required
          error={form.title === ''}
          helperText={form.title === '' ? 'Pealkiri on kohustuslik' : ''}
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Kirjeldus"
          name="description"
          value={form.description}
          onChange={handleFormChange}
          variant="outlined"
          multiline
          rows={3}
        />
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Küsimused
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleQuestionDialogOpen()}
          >
            Lisa küsimus
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {questions.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Vormil pole veel küsimusi
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => handleQuestionDialogOpen()}
              sx={{ mt: 2 }}
            >
              Lisa esimene küsimus
            </Button>
          </Box>
        ) : (
          <Box>
            {questions.map((question, index) => (
              <Card key={question.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="flex-start">
                    <DragIndicatorIcon color="action" sx={{ mr: 1, mt: 0.5 }} />
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="h6" component="div">
                          {question.text}
                          {question.required && (
                            <Typography component="span" color="error" sx={{ ml: 0.5 }}>
                              *
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center">
                        <Chip 
                          label={getQuestionTypeLabel(question.type)} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                      
                      {(['multiplechoice', 'checkbox', 'dropdown'].includes(question.type) && 
                        question.options && question.options.length > 0) && (
                        <Box mt={2}>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            Valikud:
                          </Typography>
                          <List dense>
                            {question.options.map((option, i) => (
                              <ListItem key={i} sx={{ py: 0 }}>
                                <ListItemText primary={option} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => handleQuestionDialogOpen(question, index)}
                  >
                    Muuda
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteQuestionClick(question, index)}
                  >
                    Kustuta
                  </Button>
                </CardActions>
              </Card>
            ))}
            
            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleQuestionDialogOpen()}
              >
                Lisa küsimus
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Question Dialog */}
      <Dialog 
        open={openQuestionDialog} 
        onClose={handleQuestionDialogClose}
        fullWidth
        maxWidth="md"
        aria-labelledby="question-dialog-title"
        disableRestoreFocus
      >
        <DialogTitle id="question-dialog-title">
          {editingQuestionIndex >= 0 ? 'Muuda küsimust' : 'Lisa uus küsimus'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="text"
            label="Küsimuse tekst"
            type="text"
            fullWidth
            variant="outlined"
            value={currentQuestion.text}
            onChange={handleQuestionChange}
            error={!!questionErrors.text}
            helperText={questionErrors.text}
            sx={{ mb: 2 }}
          />
          
          <Grid container spacing={2} columns={12}>
  <Grid
    sx={{
      gridColumn: {
        xs: 'span 12',
        sm: 'span 6',
      },
    }}
  >
    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
      <InputLabel id="question-type-label">Küsimuse tüüp</InputLabel>
      <Select
        labelId="question-type-label"
        id="question-type"
        name="type"
        value={currentQuestion.type}
        onChange={handleQuestionChange}
        label="Küsimuse tüüp"
        aria-labelledby="question-type-label"
      >
        <MenuItem value="shorttext">Lühivastus</MenuItem>
        <MenuItem value="paragraph">Lõik</MenuItem>
        <MenuItem value="multiplechoice">Valikvastus (üks valik)</MenuItem>
        <MenuItem value="checkbox">Märkeruudud (mitu valikut)</MenuItem>
        <MenuItem value="dropdown">Rippmenüü</MenuItem>
      </Select>
    </FormControl>
  </Grid>

  <Grid
    sx={{
      gridColumn: {
        xs: 'span 12',
        sm: 'span 6',
      },
    }}
  >
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox
            checked={currentQuestion.required}
            onChange={handleQuestionChange}
            name="required"
          />
        }
        label="Kohustuslik küsimus"
      />
    </FormGroup>
  </Grid>
</Grid>

          
          {/* Options for multiple choice, checkbox, and dropdown */}
          {['multiplechoice', 'checkbox', 'dropdown'].includes(currentQuestion.type) && (
            <Box mt={2}>
              <Typography variant="subtitle1" gutterBottom>
                Valikud
              </Typography>
              
              <List>
                {currentQuestion.options.map((option, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Valik ${index + 1}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={() => handleRemoveOption(index)}
                        disabled={currentQuestion.options.length <= 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                
                <ListItem sx={{ pl: 0 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Lisa uus valik"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Lisa valik">
                            <IconButton 
                              edge="end" 
                              onClick={handleAddOption}
                              disabled={!newOption.trim()}
                            >
                              <AddIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      )
                    }}
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleQuestionDialogClose} disabled={saving} autoFocus>Tühista</Button>
          <Button 
            onClick={handleSaveQuestion} 
            variant="contained" 
            color="primary"
            disabled={saving}
          >
            {saving ? 'Salvestan...' : 'Salvesta'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Question Dialog */}
      <Dialog 
        open={deleteQuestionDialog} 
        onClose={handleDeleteQuestionCancel}
        aria-labelledby="delete-question-dialog-title"
        aria-describedby="delete-question-dialog-description"
        disableRestoreFocus
      >
        <DialogTitle id="delete-question-dialog-title">Kinnita kustutamine</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-question-dialog-description">
            Kas olete kindel, et soovite kustutada küsimuse "{questionToDelete?.question?.text}"? 
            See toiming on pöördumatu.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteQuestionCancel} disabled={saving} autoFocus>Tühista</Button>
          <Button 
            onClick={handleDeleteQuestionConfirm} 
            variant="contained" 
            color="error"
            disabled={saving}
          >
            {saving ? 'Kustutan...' : 'Kustuta küsimus'}
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

export default FormEdit;