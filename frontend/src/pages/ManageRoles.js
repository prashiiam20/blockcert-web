import React, { useState, useContext } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { EthereumContext } from '../context/EthereumContext';
import { ROLES, ROLE_NAMES } from '../config/contracts';

export default function ManageRoles() {
  const { contract, userRole } = useContext(EthereumContext);
  const [address, setAddress] = useState('');
  const [role, setRole] = useState(3); // Default to INSTITUTION
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGrantRole = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const tx = await contract.grantRole(address, role);
      await tx.wait();

      setResult(`Role ${ROLE_NAMES[role]} granted to ${address}`);
      setAddress('');
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (userRole !== ROLES.GOVERNMENT && userRole !== ROLES.REGULATORY) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          You don't have permission to manage roles. Only Government or Regulatory Authority can manage roles.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage User Roles
        </Typography>

        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="User Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            margin="normal"
            placeholder="0x..."
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value={1}>Government</MenuItem>
              <MenuItem value={2}>Regulatory Authority</MenuItem>
              <MenuItem value={3}>Institution</MenuItem>
              <MenuItem value={4}>Student</MenuItem>
              <MenuItem value={5}>Recruiter</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleGrantRole}
            disabled={loading || !address}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Grant Role'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {result}
          </Alert>
        )}
      </Paper>
    </Container>
  );
}