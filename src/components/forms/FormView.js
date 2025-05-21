import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Checkbox,
  MenuItem,
  Select,
  InputLabel,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import FormsService from '../../services/forms.service';
import QuestionsService from '../../services/questions.service';
import ResponsesService from '../../services/responses.service';
import { useAuth } from '../auth/AuthContext';

// Helper function to initialize answers
const createInitialAnswers = (questions) => {
  const initialAnswers = {};
  questions.forEach(question => {
    if (question.type === 'checkbox') {
      initialAnswers[question.id] = [];
    } else {
      initialAnswers[question.id] = '';
    }
  });
  return initialAnswers;
};

// Reusable alert component
const AlertMessage = ({ open, message, severity, onClose }) => (
  <Snackbar
    open={open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  >
    <Alert onClose={onClose} severity={severity}>
      {message}
    </Alert>
  </Snackbar>
);

const FormView = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [form, setForm] = useState({ title: '', description: '' });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  // Fetch form and questions
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true);
        
        // Fetch form details
        const formData = await FormsService.getFormById(formId);
        setForm(formData);
        
        // Fetch form questions
        const questionsData = await QuestionsService.getQuestions(formId);
        setQuestions(questionsData);
        
        // Initialize answers object
        setAnswers(createInitialAnswers(questionsData));
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Vormi andmete laadimine ebaõnnestus. Proovige hiljem uuesti.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormData();
  }, [formId]);
  
  const handleInputChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear validation error for this question
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };
  
  const handleCheckboxChange = (questionId, value) => {
    setAnswers(prev => {
      const currentValues = prev[questionId] || [];
      
      // If value is already in array, remove it, otherwise add it
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [questionId]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [questionId]: [...currentValues, value]
        };
      }
    });
    
    // Clear validation error for this question
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    questions.forEach(question => {
      if (question.required) {
        let value = answers[question.id];
        
        if (question.type === 'checkbox') {
          if (!value || value.length === 0) {
            errors[question.id] = 'See küsimus on kohustuslik';
            isValid = false;
          }
        } else {
          if (!value || value.trim() === '') {
            errors[question.id] = 'See küsimus on kohustuslik';
            isValid = false;
          }
        }
      }
    });
    
    setValidationErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Palun täitke kõik kohustuslikud väljad');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Format answers for API
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => {
        return {
          questionId,
          answer: Array.isArray(answer) ? answer.join(', ') : answer
        };
      });
      
      // Get user info from currentUser if available
      const userData = {};
      if (currentUser && currentUser.user) {
        userData.respondentName = currentUser.user.name;
        userData.respondentEmail = currentUser.user.email;
      }
      
      // Submit response
      await ResponsesService.createResponse(formId, {
        ...userData,
        answers: formattedAnswers
      });
      
      setSuccess('Teie vastus on edukalt salvestatud!');
      
      // Clear form after submission
      setAnswers(createInitialAnswers(questions));
      
      // Navigate back to forms list after a delay
      setTimeout(() => {
        navigate('/forms', { state: { activeTab: isFormOwner() ? 0 : 1 } });
      }, 3000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Vormi saatmine ebaõnnestus. Palun proovige hiljem uuesti.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const isFormOwner = () => {
    if (!currentUser || !currentUser.user || !form) return false;
    return currentUser.user.id === form.userId;
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
          <IconButton color="primary" onClick={() => navigate('/forms', { state: { activeTab: isFormOwner() ? 0 : 1 } })} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {form.title}
          </Typography>
        </Box>
        
        {isFormOwner() && (
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/forms/${formId}/edit`)}
              sx={{ mr: 1 }}
            >
              Muuda
            </Button>
            <Button 
              variant="outlined"
              color="secondary"
              onClick={() => navigate(`/forms/${formId}/responses`)}
            >
              Vaata vastuseid
            </Button>
          </Box>
        )}
      </Box>
      
      {form.description && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="body1">
            {form.description}
          </Typography>
        </Paper>
      )}
      
      <Paper sx={{ p: 3 }}>
        {questions.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary">
              Sellel vormil pole veel küsimusi.
            </Typography>
          </Box>
        ) : (
          <Box>
            {questions.map((question, index) => (
              <Box key={question.id} mb={4}>
                <FormControl 
                  fullWidth 
                  error={!!validationErrors[question.id]}
                  required={question.required}
                >
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {question.text}
                    {question.required && (
                      <Typography component="span" color="error" sx={{ ml: 1 }}>
                        *
                      </Typography>
                    )}
                  </FormLabel>
                  
                  {/* Short text question */}
                  {question.type === 'shorttext' && (
                    <TextField
                      variant="outlined"
                      size="small"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      error={!!validationErrors[question.id]}
                      helperText={validationErrors[question.id]}
                    />
                  )}
                  
                  {/* Paragraph question */}
                  {question.type === 'paragraph' && (
                    <TextField
                      variant="outlined"
                      multiline
                      rows={4}
                      value={answers[question.id] || ''}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      error={!!validationErrors[question.id]}
                      helperText={validationErrors[question.id]}
                    />
                  )}
                  
                  {/* Multiple choice question */}
                  {question.type === 'multiplechoice' && (
                    <RadioGroup
                      value={answers[question.id] || ''}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                    >
                      {question.options.map((option, i) => (
                        <FormControlLabel
                          key={i}
                          value={option}
                          control={<Radio />}
                          label={option}
                        />
                      ))}
                      {validationErrors[question.id] && (
                        <Typography variant="caption" color="error">
                          {validationErrors[question.id]}
                        </Typography>
                      )}
                    </RadioGroup>
                  )}
                  
                  {/* Checkbox question */}
                  {question.type === 'checkbox' && (
                    <FormGroup>
                      {question.options.map((option, i) => (
                        <FormControlLabel
                          key={i}
                          control={
                            <Checkbox
                              checked={answers[question.id]?.includes(option) || false}
                              onChange={() => handleCheckboxChange(question.id, option)}
                            />
                          }
                          label={option}
                        />
                      ))}
                      {validationErrors[question.id] && (
                        <Typography variant="caption" color="error">
                          {validationErrors[question.id]}
                        </Typography>
                      )}
                    </FormGroup>
                  )}
                  
                  {/* Dropdown question */}
                  {question.type === 'dropdown' && (
                    <FormControl fullWidth variant="outlined" size="small">
                      <InputLabel>Vali vastus</InputLabel>
                      <Select
                        value={answers[question.id] || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        label="Vali vastus"
                        error={!!validationErrors[question.id]}
                      >
                        <MenuItem value="">
                          <em>-</em>
                        </MenuItem>
                        {question.options.map((option, i) => (
                          <MenuItem key={i} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                      {validationErrors[question.id] && (
                        <Typography variant="caption" color="error">
                          {validationErrors[question.id]}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                </FormControl>
                
                {index < questions.length - 1 && (
                  <Divider sx={{ mt: 3 }} />
                )}
              </Box>
            ))}
            
            <Box mt={4} display="flex" justifyContent="flex-end">
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmit}
                disabled={submitting}
                size="large"
              >
                {submitting ? 'Saadan...' : 'Saada vastused'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Success and Error Messages */}
      <AlertMessage 
        open={!!success}
        message={success}
        severity="success"
        onClose={() => setSuccess('')}
      />
      
      <AlertMessage 
        open={!!error}
        message={error}
        severity="error"
        onClose={() => setError('')}
      />
    </Container>
  );
};

export default FormView;