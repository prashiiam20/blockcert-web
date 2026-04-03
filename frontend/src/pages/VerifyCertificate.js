import React, { useState, useContext, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  InputAdornment,
  IconButton,
  Fade,
  Grow
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import HistoryIcon from '@mui/icons-material/History';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { EthereumContext } from '../context/EthereumContext';
import { ethers } from 'ethers';
import axios from 'axios';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { unzlibSync } from 'fflate';
import { useSearchParams } from 'react-router-dom';
import CertificateViewer from '../components/CertificateViewer';

export default function VerifyCertificate() {
  const { contract, account } = useContext(EthereumContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [certId, setCertId] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);
  
  // Decryption & Protocol State
  const [decryptionKey, setDecryptionKey] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState(null);

  // Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [hasAutoDecrypted, setHasAutoDecrypted] = useState(false);

  // Auto-verify if ID is in URL & Extract Key from Hash
  useEffect(() => {
    const urlId = searchParams.get('id');
    const hash = window.location.hash;

    if (urlId && contract) {
      setCertId(urlId);
      handleVerify(urlId);
    }

    if (hash && hash.startsWith('#key=')) {
      const extractedKey = hash.substring(5);
      if (extractedKey.length === 64) {
        console.log("[BlockCert] One-Tap Key detected in URL fragment");
        setDecryptionKey(extractedKey);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, searchParams]);

  // Auto-trigger decryption when both certificate and key are present
  useEffect(() => {
    if (certificate && decryptionKey && !hasAutoDecrypted && !decrypting) {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#key=')) {
        setHasAutoDecrypted(true);
        setTimeout(() => handleDecrypt(), 500); // Small delay for visual effect
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificate, decryptionKey]);

  const handleVerify = async (manualId) => {
    const targetId = manualId || certId;
    if (!targetId) return;
    
    setLoading(true);
    setError(null);
    setCertificate(null);

    try {
      const cert = await contract.getCertificate(targetId);
      
      if (cert.institution === ethers.constants.AddressZero) {
        setError('Record Not Found: This Certificate Identifier is not registered on the blockchain.');
        setLoading(false);
        return;
      }

      setCertificate({
        id: targetId,
        ipfsCID: cert.ipfsCID,
        student: cert.student,
        institution: cert.institution,
        issueDate: new Date(cert.issueDate.toNumber() * 1000).toLocaleString(),
        expiryDate: cert.expiryDate.toNumber() > 0 
          ? new Date(cert.expiryDate.toNumber() * 1000).toLocaleString()
          : 'Permanent',
        revoked: cert.revoked,
        isValid: !cert.revoked && 
          (cert.expiryDate.toNumber() === 0 || cert.expiryDate.toNumber() * 1000 > Date.now())
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('An error occurred while verifying the certificate. Please check the ID.');
      setLoading(false);
    }
  };

  const detectMimeType = (data) => {
    if (!data || data.length < 4) return 'application/octet-stream';
    // PDF: %PDF-
    if (data[0] === 0x25 && data[1] === 0x50 && data[2] === 0x44 && data[3] === 0x46) return 'application/pdf';
    // PNG: \x89PNG
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return 'image/png';
    // JPEG: \xFF\xD8\xFF
    if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg';
    return 'application/octet-stream';
  };

  const handleDecrypt = async (manualKey) => {
    const keyToUse = manualKey || decryptionKey;
    if (!keyToUse || keyToUse.length !== 64) {
      setDecryptionError('Invalid 64-character Hex Key.');
      return false;
    }
    setDecrypting(true);
    setDecryptionError(null);
    try {
      const res = await axios.get(`https://gateway.pinata.cloud/ipfs/${certificate.ipfsCID}`, { responseType: 'arraybuffer' });
      const finalPayload = new Uint8Array(res.data);
      
      // Smart Protocol Detection (BCV2 Probe)
      const isBCV2 = finalPayload[0] === 66 && finalPayload[1] === 67 && finalPayload[2] === 86 && finalPayload[3] === 50;
      const offset = isBCV2 ? 4 : 0;
      
      if (finalPayload.length < (offset + 28)) throw new Error("Invalid payload size");

      const nonce = finalPayload.slice(offset, offset + 12);
      const ciphertext = finalPayload.slice(offset + 12);

      const key = new Uint8Array(keyToUse.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const chacha = chacha20poly1305(key, nonce);
      const compressedData = chacha.decrypt(ciphertext);
      setDecryptionError(null);

      let originalData;
      try { originalData = unzlibSync(compressedData); } catch (e) { originalData = compressedData; }

      const mimeType = detectMimeType(originalData);
      const blob = new Blob([originalData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      setViewerData({
        url,
        type: mimeType
      });
      setViewerOpen(true);
      
      setDecrypting(false);
      return true;
    } catch (e) {
      console.error(e);
      setDecryptionError('Decryption failed. Please verify your Hex Key.');
      setDecrypting(false);
      return false;
    }
  };

  const handleRecoverKey = async () => {
    try {
      if (account.toLowerCase() !== certificate.institution.toLowerCase()) {
        console.warn('Unauthorized: Registry recovery requires the Registrar wallet.');
        return;
      }

      // Scanner Matrix: Permutations of messages AND hash functions
      const protocols = [
        `[BlockCert Registry] Master Recovery Key for Student: ${certificate.student.toLowerCase()}`,
        `[BlockCert Registry] Access Key for Student: ${certificate.student.toLowerCase()}`,
        `[BlockCert] Access Key for Student: ${certificate.student.toLowerCase()}`,
        `[BlockCert Registry] Master Recovery Key for Student: ${certificate.student}`,
        `[BlockCert] Security Access Key: ${certificate.student.toLowerCase()}`
      ];

      setDecrypting(true);
      setDecryptionError(null);

      for (let i = 0; i < protocols.length; i++) {
        const msg = protocols[i];
        try {
          setDecryptionError(`Scanning Protocol ${i + 1}/${protocols.length}...`);
          const signature = await contract.signer.signMessage(msg);
          
          // Test both Keccak-256 (Ethereum) and SHA-256 (Standard)
          const hashes = [
            ethers.utils.keccak256(signature),
            ethers.utils.sha256(signature)
          ];

          for (const keyHash of hashes) {
            const hexKey = keyHash.startsWith('0x') ? keyHash.substring(2) : keyHash;
            const success = await handleDecrypt(hexKey);
            if (success) {
              setDecryptionKey(hexKey);
              console.log(`[BlockCert Hyper-Scanner] MATCH FOUND!`);
              return;
            }
          }
        } catch (innerErr) {
          continue;
        }
      }

      setDecrypting(false);
      setDecryptionError('Recovery Exhausted. This record likely uses a Manual Legacy Key.');
    } catch (err) {
      console.error('Hyper-Scanner error:', err);
      setDecryptionError('Vault recovery failed.');
      setDecrypting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Container maxWidth="lg" className="animate-fade-in-up">
      {/* Hero Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 2 }}>
          Blockchain Attestation Service
        </Typography>
        <Typography variant="h3" sx={{ mt: 1, mb: 2, fontWeight: 800 }}>
          Verify Academic Credentials
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Securely authenticate certificates issued via the decentralized network. 
          Enter a Certificate ID below to perform an instant blockchain-level validation.
        </Typography>
      </Box>

      {/* Main Verification Input */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 6, 
          borderRadius: 4, 
          border: '1px solid #E5E1D1',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          maxWidth: 800,
          mx: 'auto'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={9}>
            <TextField
              fullWidth
              placeholder="Enter 66-character Certificate ID (0x...)"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FingerprintIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => handleVerify()}
              disabled={loading || !certId}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VerifiedUserIcon />}
              sx={{ height: 56, borderRadius: 2.5 }}
            >
              {loading ? 'Verifying...' : 'Verify Now'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Message */}
      {error && (
        <Fade in={!!error}>
          <Alert severity="error" variant="filled" sx={{ maxWidth: 800, mx: 'auto', mb: 4, borderRadius: 3 }}>
            {error}
          </Alert>
        </Fade>
      )}

      {/* Results Section */}
      {certificate && (
        <Grow in={!!certificate}>
          <Box sx={{ maxWidth: 900, mx: 'auto' }}>
            {/* Status Card */}
            <Paper 
              sx={{ 
                p: { xs: 3, md: 5 }, 
                borderRadius: 5, 
                position: 'relative',
                overflow: 'hidden',
                border: '1.5px solid',
                borderColor: certificate.isValid ? 'secondary.light' : 'error.light',
                boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
              }}
            >
              {/* Background Status Indicator */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: -50, 
                  right: -50, 
                  opacity: 0.1,
                  fontSize: 200,
                  transform: 'rotate(-15deg)',
                  pointerEvents: 'none'
                }}
              >
                {certificate.isValid ? <CheckCircleIcon fontSize="inherit" color="secondary" /> : <CancelIcon fontSize="inherit" color="error" />}
              </Box>

              <Grid container spacing={4}>
                <Grid item xs={12} md={5} sx={{ textAlign: 'center', borderRight: { md: '1px solid #E5E1D1' } }}>
                  {certificate.isValid ? (
                    <Box>
                      <CheckCircleIcon sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                        AUTHENTIC
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        This certificate is officially registered on the blockchain.
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <CancelIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main' }}>
                        {certificate.revoked ? 'REVOKED' : 'EXPIRED'}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        This credential is no longer valid or has been manually revoked.
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Chip 
                      icon={<SecurityIcon />} 
                      label="Blockchain Verified" 
                      color="secondary" 
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip 
                      icon={<HistoryIcon />} 
                      label={certificate.issueDate.split(',')[0]} 
                      variant="outlined" 
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUserIcon color="primary" /> Credential Details
                  </Typography>

                  <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
                    <Typography component="dt" variant="subtitle2" color="text.secondary">Student Address</Typography>
                    <Typography component="dd" variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {certificate.student}
                      <IconButton size="small" onClick={() => copyToClipboard(certificate.student)}>
                        <ContentCopyIcon fontSize="inherit" />
                      </IconButton>
                    </Typography>

                    <Typography component="dt" variant="subtitle2" color="text.secondary">Institution</Typography>
                    <Typography component="dd" variant="body2" sx={{ fontWeight: 600 }}>{certificate.institution}</Typography>

                    <Typography component="dt" variant="subtitle2" color="text.secondary">IPFS Storage CID</Typography>
                    <Typography component="dd" variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {certificate.ipfsCID}
                    </Typography>

                    <Typography component="dt" variant="subtitle2" color="text.secondary">Issuance Date</Typography>
                    <Typography component="dd" variant="body2">{certificate.issueDate}</Typography>

                    <Typography component="dt" variant="subtitle2" color="text.secondary">Expiry Date</Typography>
                    <Typography component="dd" variant="body2">{certificate.expiryDate}</Typography>
                  </Box>

                  <Divider sx={{ my: 4 }} />

                  {/* Decryption Section */}
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    background: 'rgba(139, 29, 29, 0.03)',
                    border: '1px dashed #CABBAF'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon fontSize="small" sx={{ color: 'primary.main' }} /> Encrypted Document Access
                      </Typography>
                      {account && account.toLowerCase() === certificate.institution.toLowerCase() ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="text" 
                          onClick={handleRecoverKey}
                          sx={{ fontSize: '0.65rem', fontWeight: 900, p: 0, minWidth: 0, color: '#166534', bgcolor: '#dcfce7', px: 1, borderRadius: '4px' }}
                        >
                          REGISTRAR: UNLOCK VAULT
                        </Button>
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#666' }}>
                          (v2 protocol)
                        </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 800, fontSize: '0.6rem' }}>
                          SECURED RECORD: CONTACT REGISTRY FOR RECOVERY
                        </Typography>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Hex Decryption Key"
                          type={showKey ? 'text' : 'password'}
                          value={decryptionKey}
                          onChange={(e) => setDecryptionKey(e.target.value)}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowKey(!showKey)} edge="end">
                                  {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => handleDecrypt()}
                          disabled={decrypting || !decryptionKey}
                          startIcon={decrypting ? <CircularProgress size={18} /> : <CloudDownloadIcon />}
                        >
                          View File
                        </Button>
                      </Grid>
                    </Grid>
                    {decryptionError && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        {decryptionError}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Action Footer */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button 
                variant="text" 
                color="primary" 
                onClick={() => {
                  setCertificate(null);
                  setCertId('');
                  setSearchParams({});
                }} 
                sx={{ textDecoration: 'underline' }}
              >
                Verify Another Credential
              </Button>
            </Box>
          </Box>
        </Grow>
      )}
      {/* Managed Certificate Viewer */}
      <CertificateViewer 
        open={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        certData={viewerData}
        metadata={{
          id: certificate?.id || '0x...',
          institution: certificate?.institution || 'Unknown',
          date: certificate?.issueDate || Date.now()
        }}
      />
    </Container>
  );
}