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

export default function BatchIssue() {
  const { contract } = useContext(EthereumContext);
  const [merkleRoot, setMerkleRoot] = useState('');
  const [count, setCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleBatchIssue = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const tx = await contract.issueBatch(merkleRoot, parseInt(count));
      const receipt = await tx.wait();

      setResult({
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        count: count
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Batch Certificate Issuance
        </Typography>

        <Alert severity="info" sx={{ mt: 2 }}>
          Use Merkle Tree to issue multiple certificates in one transaction.
          Generate the Merkle Root using the backend scripts.
        </Alert>

        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Merkle Root"
            value={merkleRoot}
            onChange={(e) => setMerkleRoot(e.target.value)}
            margin="normal"
            placeholder="0x..."
          />

          <TextField
            fullWidth
            type="number"
            label="Number of Certificates"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            margin="normal"
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleBatchIssue}
            disabled={loading || !merkleRoot || !count}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Issue Batch'}
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
              Batch issued successfully!
            </Alert>

            <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Batch Details
              </Typography>
              <Typography variant="body2">
                <strong>Certificates Issued:</strong> {result.count}
              </Typography>
              <Typography variant="body2">
                <strong>Transaction Hash:</strong> {result.txHash}
              </Typography>
              <Typography variant="body2">
                <strong>Total Gas Used:</strong> {result.gasUsed}
              </Typography>
              <Typography variant="body2">
                <strong>Gas per Certificate:</strong>{' '}
                {Math.floor(parseInt(result.gasUsed) / parseInt(result.count))}
              </Typography>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
}