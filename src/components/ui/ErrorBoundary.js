import React, { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import '../../styles/error-boundary.css';

/**
 * ErrorBoundary komponent, mis püüab kinni alamkomponentides tekkivad vead
 * ja kuvab kasutajasõbraliku veateate
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Uuendame state'i, et järgmine render näitaks varuvaate UI-d
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Saame siia logida veainfot
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    // Lähtestame veaoleku ja proovime uuesti laadida
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      // Kuvame kasutajasõbraliku veateate
      return (
        <Box className="error-container">
          <ErrorIcon className="error-icon" />
          <Typography variant="h4" component="h1" className="error-title">
            Midagi läks valesti
          </Typography>
          <Typography variant="body1" className="error-message">
            Vabandame, rakenduses tekkis ootamatu viga. Meie meeskond on probleemist teadlik.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleRetry}
            className="error-button"
          >
            Proovi uuesti
          </Button>
          
          {process.env.NODE_ENV === 'development' && (
            <Box className="error-details">
              <Typography variant="caption" component="div">
                {this.state.error && this.state.error.toString()}
              </Typography>
              <Typography variant="caption" component="div">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    // Kui viga pole, renderdame laste komponendid tavapäraselt
    return this.props.children;
  }
}

export default ErrorBoundary;