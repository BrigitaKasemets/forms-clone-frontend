import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormsService from '../../services/forms.service';
import QuestionsService from '../../services/questions.service';
import ResponsesService from '../../services/responses.service';

const FormResponses = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Selected response for detailed view
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState(null);
  
  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch form details
        const formData = await FormsService.getFormById(formId);
        setForm(formData);
        
        // Fetch form questions
        const questionsData = await QuestionsService.getQuestions(formId);
        setQuestions(questionsData);
        
        // Fetch form responses
        const responsesData = await ResponsesService.getResponses(formId);
        setResponses(responsesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Andmete laadimine ebaõnnestus. Proovige hiljem uuesti.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [formId]);
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle response detail view
  const handleViewResponse = (response) => {
    setSelectedResponse(response);
    setOpenDetailDialog(true);
  };
  
  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
  };
  
  // Handle response deletion
  const handleDeleteClick = (response) => {
    setResponseToDelete(response);
    setDeleteDialog(true);
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialog(false);
    setResponseToDelete(null);
  };
  
  const handleDeleteConfirm = async () => {
    if (!responseToDelete) return;
    
    try {
      setLoading(true);
      await ResponsesService.deleteResponse(formId, responseToDelete.id);
      
      // Remove the deleted response from the list
      setResponses(prev => prev.filter(r => r.id !== responseToDelete.id));
      
      // Close dialog and show success message
      setDeleteDialog(false);
      setResponseToDelete(null);
      setSuccess('Vastus on edukalt kustutatud!');
    } catch (err) {
      console.error('Error deleting response:', err);
      setError('Vastuse kustutamine ebaõnnestus. Proovige hiljem uuesti.');
    } finally {
      setLoading(false);
    }
  };
  
  // Find question by ID and return full question object
  const getQuestion = (questionId) => {
    if (!questionId) return null;
    
    // Try exact ID match first (taking care of different types)
    const question = questions.find(q => String(q.id) === String(questionId));
    return question || null;
  };
  
  // Find question text by ID
  const getQuestionText = (questionId) => {
    const question = getQuestion(questionId);
    return question ? question.text : 'Küsimus pole saadaval';
  };
  
  if (loading && !form) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton color="primary" onClick={() => navigate('/forms', { state: { activeTab: 0 } })} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Vormivastused: {form?.title}
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Kokku vastuseid: {responses.length}
        </Typography>
        
        {responses.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary">
              Sellele vormile pole veel vastatud.
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => navigate('/forms', { state: { activeTab: 0 } })}
              sx={{ mt: 2 }}
            >
              Tagasi vormide juurde
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vastaja</TableCell>
                    <TableCell>E-post</TableCell>
                    <TableCell>Vastuseid</TableCell>
                    <TableCell>Vastamise aeg</TableCell>
                    <TableCell align="right">Tegevused</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {responses
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>
                          {response.respondentName || 'Anonüümne'}
                        </TableCell>
                        <TableCell>
                          {response.respondentEmail || '-'}
                        </TableCell>
                        <TableCell>
                          {response.answers.length}
                        </TableCell>
                        <TableCell>
                          {new Date(response.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleViewResponse(response)}
                            title="Vaata vastuseid"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteClick(response)}
                            title="Kustuta vastus"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={responses.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Vastuseid lehel:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} / ${count}`
              }
            />
          </>
        )}
      </Paper>
      
      {/* Response Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Vastuste detailid
          {selectedResponse?.respondentName && (
            <>: {selectedResponse.respondentName}</>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedResponse?.respondentEmail && (
            <Box mb={2}>
              <Typography variant="subtitle2">E-post:</Typography>
              <Typography variant="body1">{selectedResponse.respondentEmail}</Typography>
            </Box>
          )}
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Vastamise aeg: {selectedResponse && new Date(selectedResponse.createdAt).toLocaleString()}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Vastused
          </Typography>
          
          {selectedResponse?.answers.map((answer, index) => {
            const question = getQuestion(answer.questionId);
            return (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    <strong>Küsimus {index + 1}:</strong> {question ? question.text.substring(0, 60) + (question.text.length > 60 ? '...' : '') : 'Küsimus pole saadaval'}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ pb: 1, borderBottom: '1px solid #eee' }}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Küsimus:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {question ? question.text : 'Küsimus pole saadaval'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Vastus:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {answer.answer || '-'}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog} color="primary">
            Sulge
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Kinnita kustutamine</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Kas olete kindel, et soovite selle vastuse kustutada? 
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
            {loading ? 'Kustutan...' : 'Kustuta vastus'}
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

export default FormResponses;