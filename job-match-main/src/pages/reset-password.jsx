import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, TextField, Typography, Container, Alert } from '@mui/material';

const API_URL = 'http://localhost:5000/api/auth';

const ResetPassword = () => {
  // Use useParams to get the token from the URL path
  const { token: tokenFromPath } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Token from path:', tokenFromPath);
    
    if (!tokenFromPath) {
      setError('Invalid reset token');
    }
  }, [tokenFromPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await axios.post(`${API_URL}/reset-password`, { 
        token: tokenFromPath, 
        newPassword: password 
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Reset Your Password
        </Typography>
        
        {success && (
          <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
            Password reset successfully! Redirecting to login...
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}

        {tokenFromPath ? (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="New Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Box>
        ) : (
          <Alert severity="warning" sx={{ width: '100%', mt: 2 }}>
            No reset token found. Please check your reset link.
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default ResetPassword;