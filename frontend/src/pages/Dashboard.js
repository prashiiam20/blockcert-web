import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import GroupIcon from '@mui/icons-material/Group';
import BatchPredictionIcon from '@mui/icons-material/BatchPrediction';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryIcon from '@mui/icons-material/History';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PublicIcon from '@mui/icons-material/Public';
import PersonIcon from '@mui/icons-material/Person';
import { EthereumContext } from '../context/EthereumContext';
import { ROLES, NETWORKS } from '../config/contracts';

export default function Dashboard() {
  const { account, network, userRole, contract } = useContext(EthereumContext);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ 
    totalIssued: 0, 
    myRecent: [], 
    globalRecent: []
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [activityTab, setActivityTab] = useState(0); // 0: My, 1: Global

  const fetchStats = useCallback(async () => {
    if (!contract || !account) return;
    try {
      setLoadingStats(true);
      
      const filter = contract.filters.CertificateIssued();
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      const mapEvent = (e) => ({
        id: e.args.certificateId,
        student: e.args.student,
        institution: e.args.institution,
        txHash: e.transactionHash
      });

      const myEvents = events.filter(e => e.args.institution.toLowerCase() === account.toLowerCase());
      
      setStats({
        totalIssued: events.length,
        myRecent: [...myEvents].reverse().slice(0, 5).map(mapEvent),
        globalRecent: [...events].reverse().slice(0, 5).map(mapEvent)
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [contract, account]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const viewOnExplorer = (hash) => {
    const explorer = NETWORKS[network]?.blockExplorer;
    if (explorer) window.open(`${explorer}/tx/${hash}`, '_blank');
  };

  const activeLogs = activityTab === 0 ? stats.myRecent : stats.globalRecent;

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <Box sx={{ mb: 6 }} className="animate-fade-in-up">
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-1.5px', color: '#1A0D0D' }}>
          Registry Intelligence
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          Real-time analytics and global auditing for the Official Academic Registry.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column: Account & Volume */}
        <Grid item xs={12} md={4} className="animate-fade-in-up stagger-1">
          <Card elevation={0} sx={{ border: '1px solid #E5E1D1', borderRadius: '20px', mb: 3 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#A13D3D', textTransform: 'uppercase', letterSpacing: '1.5px', mb: 1, display: 'block' }}>TOTAL LIFETIME ISSUANCE</Typography>
                <Typography variant="h2" sx={{ fontWeight: 900, color: '#1A0D0D' }}>{stats.totalIssued}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Institutional Records Verified</Typography>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: '1px solid #E5E1D1', borderRadius: '20px', mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, color: '#8B1D1D' }}>
                <AccountBalanceWalletIcon />
                Node Identity
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#A13D3D', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Registry Wallet</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-all', mt: 0.5, fontFamily: 'monospace' }}>{account}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#A13D3D', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Network</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{network}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#A13D3D', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Status</Typography>
                        <Box sx={{ mt: 0.5 }}>
                            <Chip label="ONLINE" size="small" sx={{ fontWeight: 800, background: '#f0fdf4', color: '#166534', border: '1px solid #bbfcce' }} />
                        </Box>
                    </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Actions & Global Log */}
        <Grid item xs={12} md={8} className="animate-fade-in-up stagger-2">
          <Card elevation={0} sx={{ border: '1px solid #E5E1D1', borderRadius: '20px', mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, color: '#1A0D0D' }}>
                <VerifiedIcon sx={{ color: '#2E5225' }} />
                Administrative Services
              </Typography>
              <Grid container spacing={2}>
                {userRole === ROLES.INSTITUTION && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Button variant="contained" startIcon={<SchoolIcon />} onClick={() => navigate('/issue')} fullWidth size="large" sx={{ py: 2 }}>
                        New Issuance
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button variant="outlined" startIcon={<BatchPredictionIcon />} onClick={() => navigate('/batch-issue')} fullWidth size="large" sx={{ py: 2 }}>
                        Batch Protocol
                      </Button>
                    </Grid>
                  </>
                )}
                <Grid item xs={12} sm={6}>
                  <Button variant="outlined" startIcon={<VerifiedIcon />} onClick={() => navigate('/verify')} fullWidth size="large" sx={{ py: 2 }}>
                    Universal Verifier
                  </Button>
                </Grid>
                {(userRole === ROLES.GOVERNMENT || userRole === ROLES.REGULATORY) && (
                  <Grid item xs={12} sm={6}>
                    <Button variant="contained" startIcon={<GroupIcon />} onClick={() => navigate('/manage-roles')} fullWidth size="large" sx={{ py: 2 }}>
                      Registry Oversight
                    </Button>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid #E5E1D1', overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, color: '#1A0D0D' }}>
                    <HistoryIcon sx={{ color: '#8B1D1D' }} />
                    Protocol Activity
                </Typography>
                <Tabs value={activityTab} onChange={(_, v) => setActivityTab(v)} sx={{ minHeight: 0 }}>
                    <Tab label="My Records" icon={<PersonIcon />} iconPosition="start" sx={{ fontWeight: 800, minHeight: 40, px: 2 }} />
                    <Tab label="Global Registry" icon={<PublicIcon />} iconPosition="start" sx={{ fontWeight: 800, minHeight: 40, px: 2 }} />
                </Tabs>
            </Box>
            
            <Box sx={{ p: 2 }}>
              {loadingStats ? (
                <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ background: '#FCFBF7' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#A13D3D' }}>RECORD ID</TableCell>
                        <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#A13D3D' }}>{activityTab === 0 ? 'STUDENT' : 'ISSUER'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#A13D3D' }}>AUDIT</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeLogs.length === 0 ? (
                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 6, color: '#94a3b8', fontWeight: 600 }}>No matching records found in the registry.</TableCell></TableRow>
                      ) : (
                        activeLogs.map((row, i) => (
                          <TableRow key={i} sx={{ '&:hover': { background: '#f8fafc' } }}>
                            <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#1A0D0D', wordBreak: 'break-all', maxWidth: 200 }}>{row.id}</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                                {activityTab === 0 ? row.student.slice(0, 10) : row.institution.slice(0, 10)}...
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => viewOnExplorer(row.txHash)} sx={{ color: '#8B1D1D' }}>
                                <OpenInNewIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}