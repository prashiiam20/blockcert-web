import React, { useContext, useEffect } from 'react';
import { Container, Paper, Typography, Button, Box, Grid } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SecurityIcon from '@mui/icons-material/Security';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { useNavigate } from 'react-router-dom';
import { EthereumContext } from '../context/EthereumContext';

export default function Login() {
  const { account, connectWallet } = useContext(EthereumContext);
  const navigate = useNavigate();

  // If already logged in, instantly route to Dashboard
  useEffect(() => {
    if (account) {
      navigate('/');
    }
  }, [account, navigate]);

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 } }} className="animate-fade-in-up">
      <Paper elevation={0} sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.05)' }}>
        <Grid container>
          {/* Left Branding/Info Panel */}
          <Grid item xs={12} md={6} sx={{ background: 'linear-gradient(135deg, #00b8d4 0%, #651fff 100%)', p: 6, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#ffffff' }}>
              BlockCert Auth
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 400 }}>
              The future of verifiable, decentralized educational credentials.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SecurityIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Military-Grade Cryptography</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FingerprintIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Role-Based Access Control</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Zero Passwords. Pure Web3.</Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right Login Panel */}
          <Grid item xs={12} md={6} sx={{ p: { xs: 4, md: 8 }, background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <Box sx={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(101, 31, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
              <Typography variant="h3">🔐</Typography>
            </Box>
            
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#1a1a2e' }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" sx={{ color: '#555568', mb: 5 }}>
              Authenticate using your Web3 Wallet to securely access your specific hierarchical role.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<AccountBalanceWalletIcon />}
              onClick={connectWallet}
              sx={{ py: 2, width: '100%', maxWidth: '350px', fontSize: '1.1rem', mb: 2 }}
            >
              Sign In with MetaMask
            </Button>
            
            <Typography variant="caption" sx={{ color: '#a0aab2', mt: 2, display: 'block' }}>
              By connecting your wallet, you agree to the Web3 smart contract execution limits.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
