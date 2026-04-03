import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Button,
  TextField,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  InputAdornment,
  IconButton,
  Tooltip,
  Divider,
  Drawer,
  List,
  ListItem
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import FolderIcon from '@mui/icons-material/Folder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import BrandedQR from '../components/BrandedQR';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { EthereumContext } from '../context/EthereumContext';
import { ROLES } from '../config/contracts';
import axios from 'axios';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { unzlibSync } from 'fflate';
import { ethers } from 'ethers';
import CertificateViewer from '../components/CertificateViewer';

// ─── Sub-component: IssuedByMe (Institution view) ───────────────────────────
function IssuedByMe({ contract, account }) {
  const [issuedCerts, setIssuedCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(null);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  useEffect(() => {
    async function loadIssued() {
      if (!contract || !account) return;
      try {
        const filter = contract.filters.CertificateIssued();
        const events = await contract.queryFilter(filter, 0, 'latest');
        const myEvents = events.filter(
          (e) => e.args.institution.toLowerCase() === account.toLowerCase()
        );

        const certs = await Promise.all(
          myEvents.map(async (event) => {
            const certId = event.args.certId;
            const cert = await contract.getCertificate(certId);
            return {
              id: certId,
              student: event.args.student,
              ipfsCID: cert.ipfsCID,
              issueDate: new Date(Number(cert.issueDate) * 1000).toLocaleString(),
              expiryDate: Number(cert.expiryDate) > 0
                ? new Date(Number(cert.expiryDate) * 1000).toLocaleDateString()
                : 'Lifetime',
              revoked: cert.revoked,
            };
          })
        );

        const grouped = {};
        certs.forEach((cert) => {
          const key = cert.student.toLowerCase();
          if (!grouped[key]) grouped[key] = { student: cert.student, certs: [] };
          grouped[key].certs.push(cert);
        });
        setIssuedCerts(Object.values(grouped));
      } catch (err) {
        console.error('Error loading issued certs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadIssued();
  }, [contract, account]);

  // Filtering Logic
  const filteredCerts = issuedCerts.filter(group => 
    group.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.certs.some(c => c.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ mb: 4 }}>
        <TextField 
          fullWidth 
          variant="outlined" 
          placeholder="Search by student address or certificate ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#8B1D1D' }} />
              </InputAdornment>
            ),
            sx: { borderRadius: '12px', bgcolor: '#ffffff', border: '1px solid #E5E1D1' }
          }}
        />
      </Box>

      {filteredCerts.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 4, background: '#f8fafc', borderStyle: 'dashed' }}>
          <Typography color="text.secondary" variant="body1" fontWeight={500}>
            {searchQuery ? 'No records match your search criteria.' : 'No records found.'}
          </Typography>
        </Paper>
      ) : (
        filteredCerts.map((group, gi) => (
          <Accordion key={gi} disableGutters elevation={0} 
            sx={{ 
              mb: 2.5, 
              borderRadius: '20px !important', 
              border: '1.5px solid #e2e8f0',
              overflow: 'hidden', 
              boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
              '&:before': { display: 'none' } 
            }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#8B1D1D' }} />}
              sx={{ background: '#FCFBF7', px: 4, py: 1.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                <Avatar sx={{ bgcolor: '#fef2f2', color: '#8B1D1D', width: 48, height: 48, fontWeight: 900, fontSize: '1rem' }}>
                  {group.student.slice(2, 4).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={800} color="#1A0D0D">
                    {group.student.slice(0, 10)}...{group.student.slice(-8)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#A13D3D', fontWeight: 700, letterSpacing: '0.5px' }}>
                    RECIPIENT ADDRESS
                  </Typography>
                </Box>
                <Chip
                  icon={<FolderIcon style={{ fontSize: '16px' }} />}
                  label={`${group.certs.length} Records`}
                  size="small"
                  sx={{ 
                    fontWeight: 800, 
                    background: '#ffffff', 
                    color: '#1A0D0D', 
                    border: '1.5px solid #E5E1D1',
                    px: 1
                  }}
                />
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0, background: '#ffffff' }}>
              <List disablePadding>
                {group.certs.map((cert, ci) => (
                  <ListItem key={ci} divider={ci < group.certs.length - 1} sx={{ p: 3, '&:hover': { background: '#f8fafc' }, transition: 'background 0.2s' }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>Certificate Identification Hash</Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mt: 1, 
                          p: 1.5, 
                          bgcolor: '#f1f5f9', 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0',
                          position: 'relative'
                        }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 700, 
                            fontFamily: 'monospace', 
                            wordBreak: 'break-all', 
                            color: '#1A0D0D',
                            fontSize: '0.85rem',
                            flex: 1
                          }}>{cert.id}</Typography>
                          <Tooltip title={copyFeedback === cert.id ? "Copied!" : "Copy Full Hash"}>
                             <IconButton size="small" onClick={() => handleCopy(cert.id)} sx={{ ml: 1, color: '#8B1D1D' }}>
                                {copyFeedback === cert.id ? <CheckCircleOutlineIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                             </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Issued On</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>{cert.issueDate}</Typography>
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Validity</Typography>
                         <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>{cert.expiryDate}</Typography>
                      </Grid>
                      <Grid item xs={12} md={2} sx={{ textAlign: { md: 'right' } }}>
                        <Chip
                          label={cert.revoked ? 'REVOKED' : 'ACTIVE'}
                          sx={{ 
                            fontWeight: 900, 
                            fontSize: '0.7rem',
                            background: cert.revoked ? '#fff1f2' : '#f0fdf4',
                            color: cert.revoked ? '#be123c' : '#15803d',
                            border: `1px solid ${cert.revoked ? '#fecdd3' : '#bbfcce'}`,
                            minWidth: 80
                          }}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MyCertificates() {
  const { contract, account, userRole } = useContext(EthereumContext);
  const [tab, setTab] = useState(0);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Metadata Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMetadata, setDrawerMetadata] = useState(null);

  // Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingCertData, setViewingCertData] = useState(null);
  const [viewingMetadata, setViewingMetadata] = useState(null);

  const isInstitution = Number(userRole) === ROLES.INSTITUTION || Number(userRole) === ROLES.GOVERNMENT;

  // Decryption states
  const [decryptionKeys, setDecryptionKeys] = useState({});
  const [decryptingIds, setDecryptingIds] = useState({});
  const [decryptionErrors, setDecryptionErrors] = useState({});

  const loadCertificates = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const certIds = await contract.getStudentCertificates(account);
      const certs = await Promise.all(
        certIds.map(async (id) => {
          const cert = await contract.getCertificate(id);
          return {
            id: id,
            ipfsCID: cert.ipfsCID,
            institution: cert.institution,
            issueDate: new Date(Number(cert.issueDate) * 1000).toLocaleDateString(),
            issueDateRaw: cert.issueDate,
            revoked: cert.revoked
          };
        })
      );
      setCertificates(certs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  const detectMimeType = (data) => {
    if (!data || data.length < 4) return 'application/octet-stream';
    if (data[0] === 0x25 && data[1] === 0x51 && data[2] === 0x44 && data[3] === 0x46) return 'application/pdf'; // Note: corrected PDF check
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return 'image/png';
    if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg';
    // Fallback PDF check (%PDF-)
    if (data[0] === 37 && data[1] === 80 && data[2] === 68 && data[3] === 70) return 'application/pdf';
    return 'application/octet-stream';
  };

  useEffect(() => { loadCertificates(); }, [loadCertificates]);

  const handleDecrypt = async (cert, index, manualKey) => {
    const certId = cert.id;
    const ipfsCID = cert.ipfsCID;
    const keyString = manualKey || decryptionKeys[certId] || '';
    
    if (keyString.length !== 64) {
      setDecryptionErrors(prev => ({ ...prev, [certId]: 'Invalid 64-character hex key.' }));
      return false;
    }
    setDecryptingIds(prev => ({ ...prev, [certId]: true }));
    setDecryptionErrors(prev => ({ ...prev, [certId]: null }));
    try {
      const res = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsCID}`, { responseType: 'arraybuffer' });
      const finalPayload = new Uint8Array(res.data);
      
      // BCV2 Probe
      const isBCV2 = finalPayload[0] === 66 && finalPayload[1] === 67 && finalPayload[2] === 86 && finalPayload[3] === 50;
      const offset = isBCV2 ? 4 : 0;
      
      if (finalPayload.length < (offset + 28)) throw new Error('Invalid payload');
      const nonce = finalPayload.slice(offset, offset + 12);
      const ciphertext = finalPayload.slice(offset + 12);
      
      const key = new Uint8Array(keyString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const chacha = chacha20poly1305(key, nonce);
      const compressedData = chacha.decrypt(ciphertext);
      
      let originalData;
      try { originalData = unzlibSync(compressedData); } catch (e) { originalData = compressedData; }
      
      const mimeType = detectMimeType(originalData);
      const blob = new Blob([originalData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      setViewingCertData({ url, type: mimeType });
      setViewingMetadata({ id: certId, institution: cert.institution, date: cert.issueDateRaw || cert.issueDate });
      setViewerOpen(true);
      return true;
    } catch (e) {
      console.error(e);
      setDecryptionErrors(prev => ({ ...prev, [certId]: 'Key mismatch or corrupted payload.' }));
      return false;
    } finally {
      setDecryptingIds(prev => ({ ...prev, [certId]: false }));
    }
  };

  const handleRecoverKey = async (cert) => {
    try {
      if (account.toLowerCase() !== cert.institution.toLowerCase()) {
        console.warn('Unauthorized: Registry recovery requires the Registrar wallet.');
        return;
      }

      setDecryptingIds(prev => ({ ...prev, [cert.id]: true }));

      // Dual-Hashing Hyper-Scanner
      const protocols = [
        `[BlockCert Registry] Master Recovery Key for Student: ${cert.student.toLowerCase()}`,
        `[BlockCert Registry] Access Key for Student: ${cert.student.toLowerCase()}`
      ];

      for (const msg of protocols) {
        try {
          const signature = await contract.signer.signMessage(msg);
          const keyHash = ethers.utils.keccak256(signature);
          const hexKey = keyHash.startsWith('0x') ? keyHash.substring(2) : keyHash;
          
          // Test decryption
          const success = await handleDecrypt(cert, 0, hexKey);
          if (success) {
            setDecryptionKeys(prev => ({ ...prev, [cert.id]: hexKey }));
            setDecryptingIds(prev => ({ ...prev, [cert.id]: false }));
            return;
          }
        } catch (e) {
          continue;
        }
      }

      setDecryptingIds(prev => ({ ...prev, [cert.id]: false }));
      setDecryptionErrors(prev => ({ ...prev, [cert.id]: 'Recovery Exhausted. Was this a manual key?' }));
    } catch (err) {
      console.error('Vault recovery failed:', err);
    }
  };

  if (loading) return (
    <Container sx={{ mt: 8, textAlign: 'center' }}>
      <CircularProgress thickness={4} size={50} sx={{ color: '#2563eb' }} />
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
        Synchronizing with blockchain...
      </Typography>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-1.5px' }}>
        Registry
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
        Access your credentials wallet or track institutional records.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ 
            borderBottom: '1px solid #e2e8f0',
            '.MuiTab-root': { fontWeight: 700, fontSize: '0.95rem', px: 3, pb: 2 }
          }}
        >
          <Tab icon={<FolderIcon />} iconPosition="start" label="My Certificates" />
          {isInstitution && (
            <Tab icon={<BusinessIcon />} iconPosition="start" label="Issued Records" />
          )}
        </Tabs>
      </Box>

      {/* ── Tab 0: My Certificates (Student view) ── */}
      {tab === 0 && (
        certificates.length === 0 ? (
          <Box sx={{ p: 10, textAlign: 'center', background: '#f1f5f9', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
            <SchoolIcon sx={{ fontSize: 60, color: '#94a3b8', mb: 2 }} />
            <Typography variant="h6" fontWeight={700} color="#64748b">Your wallet is empty</Typography>
            <Typography variant="body2" color="text.secondary">Once an institution issues a certificate to your address, it will appear here.</Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {certificates.map((cert, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card elevation={0} className="animate-fade-in-up" sx={{ 
                  borderRadius: '20px', 
                  overflow: 'hidden', 
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                }}>
                  <Box sx={{ 
                    p: 2.5, 
                    background: cert.revoked ? '#fef2f2' : 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="subtitle2" fontWeight={800} color="#64748b">CREDENTIAL #{index + 1}</Typography>
                    <Chip 
                      label={cert.revoked ? 'REVOKED' : 'VERIFIED'} 
                      sx={{ 
                        fontWeight: 900, 
                        fontSize: '0.65rem',
                        background: cert.revoked ? '#fee2e2' : '#dcfce7',
                        color: cert.revoked ? '#b91c1c' : '#15803d'
                      }} 
                      size="small" 
                    />
                  </Box>
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <BusinessIcon sx={{ color: '#94a3b8', fontSize: '18px' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Issuer</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} color="#1A0D0D">{cert.institution}</Typography>
                    </Box>
                    
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Issue Date</Typography>
                        <Typography variant="body2" fontWeight={700}>{cert.issueDate}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Protocol</Typography>
                        <Typography variant="body2" fontWeight={700}>ChaCha20-P1305</Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ 
                      p: 2, 
                      borderRadius: '12px', 
                      background: '#FCFBF7',
                      border: '1px solid #E5E1D1'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" fontWeight={900} color="#8B1D1D" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            🔒 SECURITY CHALLENGE
                          </Typography>
                          {account && account.toLowerCase() === cert.institution.toLowerCase() ? (
                            <Button 
                              size="small" 
                              variant="text" 
                              onClick={() => handleRecoverKey(cert)}
                              sx={{ fontSize: '0.65rem', fontWeight: 900, p: 0, minWidth: 0, color: '#166534', bgcolor: '#dcfce7', px: 1, borderRadius: '4px' }}
                            >
                              REGISTRAR: UNLOCK VAULT
                            </Button>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 800, fontSize: '0.6rem' }}>
                              KEY LOST? CONTACT REGISTRY HELP DESK
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: 'column' }}>
                        <TextField 
                          fullWidth 
                          variant="outlined"
                          size="small" 
                          placeholder="Enter Decryption Key"
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff' }, mb: 1.5 }}
                          value={decryptionKeys[cert.id] || ''}
                          onChange={(e) => setDecryptionKeys(prev => ({ ...prev, [cert.id]: e.target.value }))} 
                        />
                        <Button 
                          variant="contained" 
                          fullWidth
                          onClick={() => handleDecrypt(cert, index)}
                          disabled={decryptingIds[cert.id] || !(decryptionKeys[cert.id] && decryptionKeys[cert.id].length > 0)}
                          sx={{ mb: 1 }}
                        >
                          {decryptingIds[cert.id] ? <CircularProgress size={20} color="inherit" /> : 'Unlock Credential'}
                        </Button>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          size="small"
                          onClick={() => { setDrawerMetadata(cert); setDrawerOpen(true); }}
                          sx={{ color: '#4B3F3F', borderColor: '#E5E1D1' }}
                        >
                          View On-Chain Registry Info
                        </Button>
                        {decryptionErrors[cert.id] && (
                          <Typography variant="caption" color="error" sx={{ textAlign: 'center', fontWeight: 600 }}>{decryptionErrors[cert.id]}</Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}

      {/* ── Metadata Drawer ── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 450 }, p: 4, background: '#FCFBF7' } }}
      >
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={800} color="#8B1D1D">Blockchain Record</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
        </Box>
        
        {drawerMetadata && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#A13D3D', textTransform: 'uppercase', letterSpacing: '1.5px' }}>ON-CHAIN ID (CERTID)</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, wordBreak: 'break-all', mt: 0.5, fontFamily: 'monospace' }}>{drawerMetadata.id}</Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#A13D3D', textTransform: 'uppercase', letterSpacing: '1.5px' }}>ISSUED BY (INSTITUTION)</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>{drawerMetadata.institution}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#A13D3D', textTransform: 'uppercase', letterSpacing: '1.5px' }}>ISSUED ON</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>{drawerMetadata.issueDate}</Typography>
            </Box>

            <Divider />

            <Box sx={{ p: 3, background: '#ffffff', borderRadius: '16px', border: '1px solid #E5E1D1' }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#2E5225', textTransform: 'uppercase', letterSpacing: '1.5px', mb: 2, display: 'block' }}>CRYPTO SPECIFICATIONS</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Payload Storage</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>InterPlanetary File System (IPFS)</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Encryption Standard</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>ChaCha20-Poly1305 (IETF)</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Compression</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>Zlib Optimized (Deflate)</Typography>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ p: 3, background: '#ffffff', borderRadius: '20px', border: '1px solid #E5E1D1', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#1A0D0D', textTransform: 'uppercase', letterSpacing: '1.5px', mb: 2, display: 'block' }}>Instant Verification QR</Typography>
              <BrandedQR certId={drawerMetadata.id} size={150} />
              <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'text.secondary' }}>Scan with mobile to verify authenticity</Typography>
            </Box>

            <Box sx={{ mt: 'auto' }}>
              <Typography variant="caption" sx={{ color: '#4B3F3F', lineHeight: 1.5, display: 'block' }}>
                This record is immutable and verified by the Blockchain Registry Protocol. 
                Any modification to the on-chain data will immediately invalidate the verification status.
              </Typography>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ── Tab 1: Issued By Me (Institution view) ── */}
      {tab === 1 && isInstitution && (
        <IssuedByMe contract={contract} account={account} />
      )}

      {/* ── Integrated Viewer ── */}
      <CertificateViewer 
        open={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        certData={viewingCertData}
        metadata={viewingMetadata}
      />
    </Container>
  );
}