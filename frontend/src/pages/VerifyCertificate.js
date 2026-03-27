import React, { useState, useContext } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
// import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { EthereumContext } from '../context/EthereumContext';
import axios from 'axios';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { unzlibSync } from 'fflate';

export default function VerifyCertificate() {
  const { contract } = useContext(EthereumContext);
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);
  
  // Decryption State
  const [decryptionKey, setDecryptionKey] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setCertificate(null);

    try {
      const cert = await contract.getCertificate(certId);
      
      setCertificate({
        ipfsCID: cert.ipfsCID,
        student: cert.student,
        institution: cert.institution,
        issueDate: new Date(cert.issueDate.toNumber() * 1000).toLocaleString(),
        expiryDate: cert.expiryDate.toNumber() > 0 
          ? new Date(cert.expiryDate.toNumber() * 1000).toLocaleString()
          : 'No expiry',
        revoked: cert.revoked,
        isValid: !cert.revoked && 
          (cert.expiryDate.toNumber() === 0 || cert.expiryDate.toNumber() * 1000 > Date.now())
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Certificate not found or invalid Certificate ID');
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!decryptionKey || decryptionKey.length !== 64) {
      setDecryptionError('Invalid 64-character Hex Key.');
      return;
    }
    setDecrypting(true);
    setDecryptionError(null);
    try {
      const res = await axios.get(`https://gateway.pinata.cloud/ipfs/${certificate.ipfsCID}`, { responseType: 'arraybuffer' });
      const finalPayload = new Uint8Array(res.data);
      if (finalPayload.length < 28) throw new Error("Invalid payload size");

      const nonce = finalPayload.slice(0, 12);
      const ciphertext = finalPayload.slice(12);

      const key = new Uint8Array(decryptionKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      const chacha = chacha20poly1305(key, nonce);
      const compressedData = chacha.decrypt(ciphertext);

      let originalData;
      try {
        originalData = unzlibSync(compressedData);
      } catch (e) {
        originalData = compressedData; 
      }

      const blob = new Blob([originalData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      setDecrypting(false);
    } catch (e) {
      console.error(e);
      setDecryptionError('Decryption failed. Ensure the key is correct and the file is an authentic encrypted payload.');
      setDecrypting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Verify Certificate
        </Typography>

        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Certificate ID"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            margin="normal"
            placeholder="0x..."
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleVerify}
            disabled={loading || !certId}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify Certificate'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {certificate && (
          <Box sx={{ mt: 4 }}>
            <Alert severity={certificate.isValid ? "success" : "error"}>
              {certificate.isValid ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon />
                  <Typography>Certificate is VALID</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CancelIcon />
                  <Typography>Certificate is INVALID or REVOKED</Typography>
                </Box>
              )}
            </Alert>

            <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Certificate Information
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>IPFS CID:</strong> {certificate.ipfsCID}
                </Typography>
                <Typography variant="body2">
                  <strong>Student:</strong> {certificate.student}
                </Typography>
                <Typography variant="body2">
                  <strong>Institution:</strong> {certificate.institution}
                </Typography>
                <Typography variant="body2">
                  <strong>Issue Date:</strong> {certificate.issueDate}
                </Typography>
                <Typography variant="body2">
                  <strong>Expiry Date:</strong> {certificate.expiryDate}
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Chip
                    label={certificate.revoked ? "REVOKED" : "ACTIVE"}
                    color={certificate.revoked ? "error" : "success"}
                    icon={certificate.revoked ? <CancelIcon /> : <CheckCircleIcon />}
                  />
                </Box>

                <Box sx={{ mt: 3, p: 2, border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: 3, background: 'rgba(0, 229, 255, 0.05)' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: '#00b8d4', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🔒 Encrypted IPFS Payload
                  </Typography>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Enter exactly 64-character Hex Decryption Key" 
                    value={decryptionKey}
                    onChange={(e) => setDecryptionKey(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleDecrypt}
                    disabled={decrypting || !decryptionKey}
                  >
                    {decrypting ? <CircularProgress size={24} color="inherit" /> : 'Decrypt & View Document'}
                  </Button>
                  {decryptionError && (
                    <Alert severity="error" sx={{ mt: 2 }}>{decryptionError}</Alert>
                  )}
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
}