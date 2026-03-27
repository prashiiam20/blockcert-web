import React, { useState, useContext } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { EthereumContext } from '../context/EthereumContext';

export default function RevokeCertificate() {
  const { contract } = useContext(EthereumContext);
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!certId.startsWith('0x') || certId.length !== 66) {
        throw new Error("Invalid Certificate ID format. It should be a 32-byte hex string starting with 0x.");
      }

      // Revoke certificate
      const tx = await contract.revokeCertificate(certId);
      const receipt = await tx.wait();

      setResult({
        certId,
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString()
      });

      setLoading(false);
      setCertId(''); // clear the field
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Revoke Certificate
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Institutions can permanently revoke certificates they have issued. This action cannot be undone.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Certificate ID"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            margin="normal"
            required
            placeholder="0x..."
          />

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            size="large"
            fullWidth
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Revoke Certificate'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 4 }}>
            <Alert severity="success">
              Certificate revoked successfully!
            </Alert>

            <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Transaction Details
              </Typography>
              <Typography variant="body2">
                <strong>Certificate ID:</strong> {result.certId}
              </Typography>
              <Typography variant="body2">
                <strong>Transaction Hash:</strong> {result.txHash}
              </Typography>
              <Typography variant="body2">
                <strong>Gas Used:</strong> {result.gasUsed}
              </Typography>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
