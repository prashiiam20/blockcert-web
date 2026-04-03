import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Fade,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Stack,
  Chip
} from '@mui/material';
import { EthereumContext } from '../context/EthereumContext';
import { ethers } from 'ethers';
import axios from 'axios';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { zlibSync } from 'fflate';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VerifiedIcon from '@mui/icons-material/Verified';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import { BarChart } from '@mui/x-charts/BarChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PublicIcon from '@mui/icons-material/Public';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Sub-component: PreviewCard (Sticky Draft) ──────────────────────────────
function PreviewCard({ data, file }) {
  return (
    <Card elevation={4} sx={{ 
      position: 'sticky', 
      top: 100, 
      borderRadius: '24px', 
      border: '2px solid #E5E1D1', 
      background: '#FCFBF7',
      overflow: 'hidden'
    }}>
      <Box sx={{ p: 2, background: '#8B1D1D', color: '#ffffff', textAlign: 'center' }}>
        <Typography variant="caption" fontWeight={900} sx={{ letterSpacing: '2px' }}>DRAFT PREVIEW</Typography>
      </Box>
      <CardContent sx={{ p: 4, textAlign: 'center' }}>
        <SchoolIcon sx={{ fontSize: 48, color: '#8B1D1D', mb: 2 }} />
        <Typography variant="h6" fontWeight={800} color="#1A0D0D" sx={{ mb: 1 }}>
          {data.studentName || 'Recipient Name'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 3 }}>
          {data.studentAddress ? `${data.studentAddress.slice(0, 10)}...${data.studentAddress.slice(-8)}` : '0x...'}
        </Typography>
        
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
        
        <Grid container spacing={2} sx={{ textAlign: 'left' }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>DEGREE</Typography>
            <Typography variant="body2" fontWeight={700}>{data.degree || '—'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>GPA / GRADE</Typography>
            <Typography variant="body2" fontWeight={700}>{data.gpa || '—'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>SECURE ATTACHMENT</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {file ? <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#2E5225' }} /> : null}
              {file ? file.name : 'No file selected'}
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, p: 2, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #E5E1D1' }}>
          <Typography variant="caption" sx={{ color: '#A13D3D', fontWeight: 800 }}>
            CRYPTO STANDARD: CHACHA20-POLY1305
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

const steps = ['Identity', 'Academic Details', 'Secure Packaging'];

export default function IssueCertificate() {
  const { contract, account } = useContext(EthereumContext);
  const [activeStep, setActiveStep] = useState(0);
  const [stats, setStats] = useState({ totalIssued: 0, chartData: [] });
  const [loadingVolume, setLoadingVolume] = useState(true);

  // ─── Fetch Issuance Stats (Monthly Grid) ──────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!contract || !account) return;
    try {
      setLoadingVolume(true);
      const filter = contract.filters.CertificateIssued();
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      const myEvents = events.filter(e => e.args.institution.toLowerCase() === account.toLowerCase());
      
      // Monthly Grouping (Last 6 Months)
      const monthlyCounts = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        monthlyCounts[monthKey] = 0;
      }

      const myEventsWithTime = await Promise.all(
        myEvents.map(async (e) => {
          const block = await e.getBlock();
          return { timestamp: block.timestamp };
        })
      );

      myEventsWithTime.forEach(e => {
        const d = new Date(e.timestamp * 1000);
        const monthKey = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        if (monthlyCounts.hasOwnProperty(monthKey)) {
          monthlyCounts[monthKey]++;
        }
      });

      const formattedChartData = Object.keys(monthlyCounts).map(label => ({
        month: label,
        count: monthlyCounts[label]
      }));

      setStats({
        totalIssued: myEvents.length,
        chartData: formattedChartData
      });
    } catch (err) {
      console.error('Error fetching issuance stats:', err);
    } finally {
      setLoadingVolume(false);
    }
  }, [contract, account]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const [formData, setFormData] = useState({
    studentAddress: '',
    studentName: '',
    degree: '',
    gpa: '',
    expiryYears: '0' // 0 = Lifetime
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isStepValid = () => {
    if (activeStep === 0) return ethers.utils.isAddress(formData.studentAddress) && formData.studentName;
    if (activeStep === 1) return formData.degree && formData.gpa;
    if (activeStep === 2) return selectedFile;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!selectedFile) throw new Error("Please select a document.");
      
      // 1. Preparation & Compression
      const arrayBuffer = await selectedFile.arrayBuffer();
      const rawUint8 = new Uint8Array(arrayBuffer);
      const compressedData = zlibSync(rawUint8);

      // 2. Cryptographic Key Generation (Institutional Registry Vault model)
      // The Registrar (Issuer) provides the master signature for all students.
      // This ensures the Institution (the Registrar) can always regenerate a student's key on demand.
      const derivationMessage = `[BlockCert Registry] Master Recovery Key for Student: ${formData.studentAddress.toLowerCase()}`;
      const signature = await contract.signer.signMessage(derivationMessage);
      const keyHash = ethers.utils.keccak256(signature);
      const key = ethers.utils.arrayify(keyHash);
      const hexDecryptionKey = keyHash.startsWith('0x') ? keyHash.substring(2) : keyHash;
      
      const nonce = new Uint8Array(12);
      window.crypto.getRandomValues(nonce);

      // 3. AEAD Encryption (ChaCha20-Poly1305)
      const chacha = chacha20poly1305(key, nonce);
      const ciphertext = chacha.encrypt(compressedData);

      // 4. Protocol Versioning Header (BCV2 Magic Marker)
      // We prepend [66, 67, 86, 50] to identify this as a "Vault-Enabled" record
      const magicMarker = new Uint8Array([66, 67, 86, 50]);
      const finalPayload = new Uint8Array(magicMarker.length + 12 + ciphertext.length);
      finalPayload.set(magicMarker, 0);
      finalPayload.set(nonce, magicMarker.length);
      finalPayload.set(ciphertext, magicMarker.length + 12);

      const encryptedBlob = new Blob([finalPayload], { type: 'application/octet-stream' });
      const encryptedFile = new File([encryptedBlob], `${selectedFile.name}.encrypted`, { type: 'application/octet-stream' });
      
      // 5. IPFS Anchoring
      const pinataData = new FormData();
      pinataData.append('file', encryptedFile);

      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", pinataData, {
        headers: { 'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT}` }
      });
      
      const generatedCID = res.data.IpfsHash;

      // 5. Blockchain Registration (With Metadata Header)
      const certHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(formData.studentAddress + generatedCID + Date.now())
      );

      const expiryDate = formData.expiryYears === '0' 
        ? 0 
        : Math.floor(Date.now() / 1000) + (parseInt(formData.expiryYears) * 365 * 24 * 60 * 60);

      const tx = await contract.issueCertificate(
        generatedCID,
        certHash,
        formData.studentAddress,
        expiryDate
      );

      const receipt = await tx.wait();
      
      const eventSignature = "CertificateIssued(bytes32,address,address)";
      const eventTopic = ethers.utils.id(eventSignature);

      let certId;
      try {
        const log = receipt.logs.find(l => l.topics[0].toLowerCase() === eventTopic.toLowerCase());
        if (log) {
          certId = log.topics[1];
          console.log("Matched CertificateIssued log at index:", receipt.logs.indexOf(log));
        } else {
          // Fallback to receipt.events for better compatibility with different providers
          const event = receipt.events?.find(e => e.event === 'CertificateIssued');
          certId = event ? event.args.certId : receipt.logs[0].topics[1];
          console.log("Using fallback extraction method.");
        }
      } catch (logErr) {
        console.error("Log Parsing Error:", logErr);
        certId = receipt.logs[0].topics[1];
      }

      console.log("Final Extracted CertID:", certId);

      setResult({
        certId,
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        decryptionKey: hexDecryptionKey,
        isVaultBacked: true
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [tabValue, setTabValue] = useState(0);

  if (result) {
    const shareableUrl = `${window.location.protocol}//${window.location.host}/verify?id=${result.certId}#key=${result.decryptionKey}`;

    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Fade in={true}>
          <Box>
            <Card elevation={0} sx={{ 
              borderRadius: '24px', 
              border: '1px solid #bbfcce', 
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
              textAlign: 'center',
              p: 5,
              mb: 4
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#dcfce7', color: '#166534', width: 80, height: 80 }}>
                  <VerifiedIcon sx={{ fontSize: 40 }} />
                </Avatar>
              </Box>
              <Typography variant="h4" fontWeight={800} color="#166534" gutterBottom>
                Institutional Issuance Successful
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                The record is now immutable and anchored to the local registry.
              </Typography>

              <Box sx={{ p: 4, background: '#1A0D0D', borderRadius: '20px', color: '#ffffff', position: 'relative', mb: 4 }}>
                <Box sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', width: 'max-content' }}>
                    <Chip 
                      icon={<SecurityIcon style={{ color: '#166534', fontSize: '1rem' }} />}
                      label="REGISTRY-BACKED & VAULT-SECURED" 
                      size="small" 
                      sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 900, border: '2px solid #166534', px: 1 }}
                    />
                </Box>
                <Typography variant="caption" sx={{ color: '#A13D3D', fontWeight: 900, letterSpacing: '1px' }}>
                  🔒 MASTER DECRYPTION KEY (DO NOT SHARE)
                </Typography>
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 700, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {result.decryptionKey}
                </Typography>
                <Button 
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopy(result.decryptionKey)}
                  sx={{ mt: 2, color: '#A13D3D', fontWeight: 800 }}
                >
                  {copied ? 'COPIED' : 'COPY MASTER KEY'}
                </Button>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
                Credential Access Options
              </Typography>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} centered>
                  <Tab icon={<SecurityIcon />} label="Standard Registration" />
                  <Tab icon={<OfflineBoltIcon />} label="One-Tap Shareable" />
                </Tabs>
              </Box>

              <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 4, bgcolor: '#fff', border: '2px solid #8B1D1D', borderRadius: '24px', boxShadow: '0 20px 50px rgba(139, 29, 29, 0.12)', textAlign: 'center', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: -15, right: 20 }}>
                      <Chip label="RECOMMENDED FOR STUDENTS" color="primary" size="small" sx={{ fontWeight: 900, borderRadius: '6px' }} />
                    </Box>
                    <OfflineBoltIcon sx={{ color: '#8B1D1D', fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" fontWeight={900} color="#1A0D0D">Universal Verification Token</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 2 }}>
                      Scan this QR code with any mobile device for instant, zero-friction verification. The decryption key is securely embedded in the token.
                    </Typography>
                    
                    <BrandedQR certId={result.certId} decryptionKey={result.decryptionKey} size={200} />
                    
                    <Stack spacing={2} sx={{ mt: 3 }}>
                      <Button 
                        variant="contained"
                        startIcon={<LinkIcon />} 
                        onClick={() => handleCopy(shareableUrl)}
                        sx={{ py: 1.5, fontWeight: 800, borderRadius: '12px' }}
                      >
                        {copied ? 'LINK COPIED' : 'COPY ONE-TAP LINK'}
                      </Button>
                      <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                        * This token includes the decryption key for immediate access.
                      </Typography>
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, height: '100%', justifyContent: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PublicIcon color="primary" /> Global Public Access
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        The certificate is now live on the Ethereum Blockchain and IPFS. Anyone with the ID can verify its status.
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" fontWeight={900} color="primary" sx={{ display: 'block', mb: 1 }}>
                        MOBILE SCANNING TIP
                      </Typography>
                      <Typography variant="body2" color="#475569" sx={{ fontSize: '0.8rem' }}>
                        During this development session, ensure you are accessing the portal via your <strong>Local IP</strong> (e.g., http://192.168.x.x:3000) for your phone to reach the registry.
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" fontWeight={800} color="text.secondary">RECORD IDENTIFIER</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1A0D0D' }}>{result.certId}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Chip label={`On-Chain ID: ${result.certId.slice(0, 10)}...`} variant="outlined" />
                <Chip label="Zero-Knowledge Fragment Enabled" color="secondary" size="small" />
              </Box>
            </Card>

            <Button 
              fullWidth
              variant="outlined" 
              onClick={() => window.location.reload()}
              sx={{ py: 2, borderRadius: '12px', fontWeight: 800 }}
            >
              Issue Another Certificate
            </Button>
          </Box>
        </Fade>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <Grid container spacing={6}>
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} className="animate-fade-in-up">
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-1.5px', color: '#1A0D0D' }}>
                Issuance Portal
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Academic Registry & Secure Cryptographic Deployment
              </Typography>
            </Box>
            
            <Box sx={{ 
              p: 2, 
              bgcolor: '#FCFBF7', 
              borderRadius: '16px', 
              border: '1px solid #E5E1D1',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              minWidth: '200px'
            }}>
              <Avatar sx={{ bgcolor: '#8B1D1D', width: 48, height: 48 }}>
                <AssessmentIcon sx={{ color: '#ffffff' }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#A13D3D', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Total Volume
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#1A0D0D' }}>
                  {loadingVolume ? '...' : stats.totalIssued}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Card elevation={0} sx={{ border: '1px solid #E5E1D1', borderRadius: '24px', mb: 4, background: '#FCFBF7' }}>
            <CardContent sx={{ p: 4 }}>
               <Typography variant="h6" sx={{ mb: 2, fontWeight: 800, color: '#8B1D1D', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon fontSize="small" /> Institutional Issuance Trends
               </Typography>
               {loadingVolume ? (
                  <Box sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>
               ) : (
                  <Box sx={{ height: 180, width: '100%' }}>
                     <BarChart
                        dataset={stats.chartData}
                        xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
                        series={[{ dataKey: 'count', color: '#8B1D1D', label: 'Certificates' }]}
                        height={180}
                        margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                        slotProps={{ legend: { hidden: true } }}
                     />
                  </Box>
               )}
            </CardContent>
          </Card>

          <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', border: '1px solid #E5E1D1', background: '#ffffff' }}>
            {activeStep === 0 && (
              <Fade in={true}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6" fontWeight={800}>Participant Identity</Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>STUDENT FULL NAME</Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g., John Doe"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    sx={{ mb: 4 }}
                  />
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>ETHEREUM WALLET ADDRESS</Typography>
                  <TextField
                    fullWidth
                    placeholder="0x..."
                    value={formData.studentAddress}
                    onChange={(e) => setFormData({ ...formData, studentAddress: e.target.value })}
                    error={formData.studentAddress && !ethers.utils.isAddress(formData.studentAddress)}
                    helperText={formData.studentAddress && !ethers.utils.isAddress(formData.studentAddress) ? "Invalid Address" : ""}
                  />
                </Box>
              </Fade>
            )}

            {activeStep === 1 && (
              <Fade in={true}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <AssignmentIcon color="primary" />
                    <Typography variant="h6" fontWeight={800}>Academic Details</Typography>
                  </Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>DEGREE PROGRAM</Typography>
                      <TextField
                        fullWidth
                        placeholder="Bachelor of Technology in CS"
                        value={formData.degree}
                        onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>GPA / GRADE</Typography>
                      <TextField
                        fullWidth
                        placeholder="e.g., 9.8 / 10"
                        value={formData.gpa}
                        onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>EXPIRY (YEARS)</Typography>
                      <TextField
                        fullWidth
                        type="number"
                        placeholder="0 for Lifetime"
                        value={formData.expiryYears}
                        onChange={(e) => setFormData({ ...formData, expiryYears: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Fade>
            )}

            {activeStep === 2 && (
              <Fade in={true}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <SecurityIcon color="primary" />
                    <Typography variant="h6" fontWeight={800}>Secure Packaging</Typography>
                  </Box>
                  
                  <Box 
                    sx={{ 
                      p: 5, 
                      border: '2px dashed #D1CBB1', 
                      borderRadius: '16px', 
                      textAlign: 'center', 
                      mb: 4, 
                      bgcolor: selectedFile ? '#fdf2f2' : '#FCFBF7',
                      cursor: 'pointer',
                      '&:hover': { borderColor: '#8B1D1D' }
                    }}
                    component="label"
                  >
                    <input 
                      type="file" 
                      hidden 
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                    <CloudUploadIcon sx={{ fontSize: 48, color: '#D1CBB1', mb: 2 }} />
                    <Typography variant="body1" fontWeight={700}>
                      {selectedFile ? selectedFile.name : 'Select Final Document'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">PDF or Image Format</Typography>
                  </Box>

                  <List sx={{ bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <ListItem>
                      <ListItemIcon><VerifiedIcon sx={{ color: '#2E5225' }} /></ListItemIcon>
                      <ListItemText primary="Client-Side ZLib Compression" secondary="Active" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><SecurityIcon sx={{ color: '#2E5225' }} /></ListItemIcon>
                      <ListItemText primary="ChaCha20-Poly1305 (256-bit)" secondary="Ready" />
                    </ListItem>
                  </List>
                </Box>
              </Fade>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
              >
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!isStepValid() || loading}
                  sx={{ fontWeight: 800, px: 6 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Deploy'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  sx={{ fontWeight: 800, px: 6 }}
                >
                  Continue
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <PreviewCard data={formData} file={selectedFile} />
          {error && <Alert severity="error" sx={{ mt: 3, borderRadius: '12px' }}>{error}</Alert>}
        </Grid>
      </Grid>
    </Container>
  );
}
