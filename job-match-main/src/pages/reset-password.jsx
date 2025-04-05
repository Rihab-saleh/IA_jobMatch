import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  TextField, 
  Container, 
  Box, 
  Alert, 
  CircularProgress,
  Typography,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  LockReset as LockResetIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

export default function ResetPassword() {
  const { token = '', userId = '' } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Verify token on mount
  const verifyToken = useCallback(async () => {
    // Return early if token or userId are missing
    if (!token || !userId) {
      setValidToken(false);
      setError('Missing token or user information');
      setTokenVerifying(false);
      return;
    }

    try {
      setTokenVerifying(true);
      const response = await fetch(`/api/auth/verify-token/${encodeURIComponent(userId)}/${encodeURIComponent(token)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid token');
      }
      
      setValidToken(true);
    } catch (err) {
      setValidToken(false);
      setError(err.message || 'Link is invalid or expired');
    } finally {
      setTokenVerifying(false);
    }
  }, [token, userId]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const validatePassword = (pass) => {
    if (pass.length < 8) {
      return "Password must be at least 8 characters";
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(pass)) {
      return "Password must contain at least one uppercase letter";
    }
    
    // Check for at least one number
    if (!/\d/.test(pass)) {
      return "Password must contain at least one number";
    }
    
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      return setError("Passwords don't match");
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return setError(passwordError);
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          token, 
          newPassword: password 
        })
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      setSuccess(true);
      // Clear form fields for security
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  if (tokenVerifying) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', mt: 10 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Verifying your reset link...
        </Typography>
      </Container>
    );
  }

  if (!validToken) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LockResetIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" component="h1" gutterBottom>
            Invalid Reset Link
          </Typography>
        </Box>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'This password reset link is invalid or has expired'}
        </Alert>
        
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/forgot-password')}
          >
            Get New Reset Link
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ 
        mt: 8, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        <LockResetIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
        <Typography component="h1" variant="h5" gutterBottom>
          Reset Your Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Please create a strong password that you don't use elsewhere
        </Typography>

        {success ? (
          <Alert severity="success" sx={{ width: '100%', mt: 3 }}>
            Password reset successfully! Redirecting to login page...
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="New Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Must be at least 8 characters with uppercase and numbers"
            />

            <TextField
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={confirmPassword !== '' && password !== confirmPassword}
              helperText={
                confirmPassword !== '' && password !== confirmPassword ? 
                "Passwords don't match" : " "
              }
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !password || !confirmPassword}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
}