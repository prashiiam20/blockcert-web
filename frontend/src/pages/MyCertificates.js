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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import FolderIcon from '@mui/icons-material/Folder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import { EthereumContext } from '../context/EthereumContext';
import { ROLES } from '../config/contracts';
import axios from 'axios';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { unzlibSync } from 'fflate';

// ─── Issued By Me (Institution view) ────────────────────────────────────────
function IssuedByMe({ contract, account }) {
  const [issuedCerts, setIssuedCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIssued() {
      if (!contract || !account) return;
      try {
        // CertificateIssued(bytes32 indexed certId, address student, address institution)
        // Only certId is indexed — can't filter student/institution on-chain.
        // Fetch all events, then filter client-side by institution address.
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
              issueDate: new Date(Number(cert.issueDate) * 1000).toLocaleDateString(),
              expiryDate: Number(cert.expiryDate) > 0
                ? new Date(Number(cert.expiryDate) * 1000).toLocaleDateString()
                : 'No expiry',
              revoked: cert.revoked,
            };
          })
        );

        // Group certs by student address
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

  if (loading) return <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Box>;

  if (issuedCerts.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center', mt: 3 }}>
        <Typography color="text.secondary">
          No certificates have been issued from this account yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {issuedCerts.map((group, gi) => (
        <Accordion key={gi} defaultExpanded={gi === 0} sx={{ mb: 1.5, borderRadius: '12px !important', overflow: 'hidden', '&:before': { display: 'none' } }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ background: 'rgba(124,77,255,0.07)', px: 3, py: 1.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                <PersonIcon fontSize="small" />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  Student: {group.student.slice(0, 10)}...{group.student.slice(-6)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {group.student}
                </Typography>
              </Box>
              <Chip
                icon={<FolderIcon />}
                label={`${group.certs.length} cert${group.certs.length !== 1 ? 's' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {group.certs.map((cert, ci) => (
                <Grid item xs={12} md={6} key={ci}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700}>Certificate #{ci + 1}</Typography>
                        <Chip
                          label={cert.revoked ? 'REVOKED' : 'VALID'}
                          color={cert.revoked ? 'error' : 'success'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        <strong>ID:</strong> {cert.id.slice(0, 14)}...{cert.id.slice(-6)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>IPFS CID:</strong> {cert.ipfsCID || '—'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Issued:</strong> {cert.issueDate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Expires:</strong> {cert.expiryDate}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MyCertificates() {
  const { contract, account, userRole } = useContext(EthereumContext);
  const [tab, setTab] = useState(0);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { loadCertificates(); }, [loadCertificates]);

  const handleDecrypt = async (certId, ipfsCID) => {
    const keyString = decryptionKeys[certId] || '';
    if (keyString.length !== 64) {
      setDecryptionErrors(prev => ({ ...prev, [certId]: 'Invalid 64-character Hex Key' }));
      return;
    }
    setDecryptingIds(prev => ({ ...prev, [certId]: true }));
    setDecryptionErrors(prev => ({ ...prev, [certId]: null }));
    try {
      const res = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsCID}`, { responseType: 'arraybuffer' });
      const finalPayload = new Uint8Array(res.data);
      if (finalPayload.length < 28) throw new Error('Invalid payload size');
      const nonce = finalPayload.slice(0, 12);
      const ciphertext = finalPayload.slice(12);
      const key = new Uint8Array(keyString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const chacha = chacha20poly1305(key, nonce);
      const compressedData = chacha.decrypt(ciphertext);
      let originalData;
      try { originalData = unzlibSync(compressedData); } catch (e) { originalData = compressedData; }
      const blob = new Blob([originalData], { type: 'application/octet-stream' });
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (e) {
      console.error(e);
      setDecryptionErrors(prev => ({ ...prev, [certId]: 'Decryption failed. Key invalid or corrupted payload.' }));
    }
    setDecryptingIds(prev => ({ ...prev, [certId]: false }));
  };

  if (loading) return <Container sx={{ mt: 4, textAlign: 'center' }}><CircularProgress /></Container>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Certificates</Typography>

      {/* Tabs — show "Issued by Me" only for Institution / Government role */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 1 }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab icon={<SchoolIcon />} iconPosition="start" label="My Certificates" />
        {isInstitution && (
          <Tab icon={<BusinessIcon />} iconPosition="start" label="Issued by Me" />
        )}
      </Tabs>
      <Divider sx={{ mb: 3 }} />

      {/* ── Tab 0: My Certificates (received as student) ── */}
      {tab === 0 && (
        certificates.length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No certificates found for this address.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {certificates.map((cert, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Certificate #{index + 1}</Typography>
                      <Chip label={cert.revoked ? 'REVOKED' : 'VALID'} color={cert.revoked ? 'error' : 'success'} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary"><strong>ID:</strong> {cert.id.slice(0, 10)}...</Typography>
                    <Typography variant="body2" color="text.secondary"><strong>IPFS:</strong> {cert.ipfsCID}</Typography>
                    <Typography variant="body2" color="text.secondary"><strong>Institution:</strong> {cert.institution.slice(0, 10)}...</Typography>
                    <Typography variant="body2" color="text.secondary"><strong>Issued:</strong> {cert.issueDate}</Typography>
                    <Box sx={{ mt: 3, p: 2, border: '1px solid rgba(0,229,255,0.3)', borderRadius: 2, background: 'rgba(0,229,255,0.05)' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: '#00b8d4' }}>🔒 Encrypted Payload</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        <TextField fullWidth size="small" placeholder="Enter 64-char Hex Decryption Key"
                          value={decryptionKeys[cert.id] || ''}
                          onChange={(e) => setDecryptionKeys(prev => ({ ...prev, [cert.id]: e.target.value }))} />
                        <Button variant="contained" size="small"
                          onClick={() => handleDecrypt(cert.id, cert.ipfsCID)}
                          disabled={decryptingIds[cert.id] || !(decryptionKeys[cert.id] && decryptionKeys[cert.id].length > 0)}>
                          {decryptingIds[cert.id] ? <CircularProgress size={20} color="inherit" /> : 'Decrypt & View'}
                        </Button>
                        {decryptionErrors[cert.id] && (
                          <Typography variant="caption" color="error">{decryptionErrors[cert.id]}</Typography>
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

      {/* ── Tab 1: Issued By Me (institution only) ── */}
      {tab === 1 && isInstitution && (
        <IssuedByMe contract={contract} account={account} />
      )}
    </Container>
  );
}