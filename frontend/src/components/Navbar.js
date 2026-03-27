import React, { useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { Link } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { EthereumContext } from '../context/EthereumContext';
import { NETWORKS, ROLES, ROLE_NAMES } from '../config/contracts';

export default function Navbar() {
  const { account, network, userRole, disconnectWallet, switchNetwork } = useContext(EthereumContext);

  return (
    <AppBar position="fixed" elevation={0} sx={{ 
      background: 'rgba(255, 255, 255, 0.75)', 
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.06)',
      borderRadius: '24px',
      margin: '24px auto',
      width: 'calc(100% - 48px)',
      maxWidth: '1200px',
      left: 0,
      right: 0,
      zIndex: (theme) => theme.zIndex.drawer + 1
    }}>
      <Toolbar sx={{ py: 1, px: { xs: 2, md: 4 } }}>
        <Typography variant="h5" component={Link} to="/" sx={{ flexGrow: 1, fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <span style={{ fontSize: '28px' }}>🎓</span> 
          <span style={{ background: 'linear-gradient(to right, #00b8d4 0%, #651fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            BlockCert
          </span>
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center', mr: 2 }}>
          {account && <Button sx={{ color: '#555568', fontWeight: 600, '&:hover': { color: '#00b8d4', background: 'rgba(0,184,212,0.05)' } }} component={Link} to="/">Dashboard</Button>}
          
          {/* INSTITUTION ONLY */}
          {userRole === ROLES.INSTITUTION && (
            <>
              <Button sx={{ color: '#555568', fontWeight: 600, '&:hover': { color: '#00b8d4', background: 'rgba(0,184,212,0.05)' } }} component={Link} to="/issue">Issue</Button>
              <Button sx={{ color: '#555568', fontWeight: 600, '&:hover': { color: '#00b8d4', background: 'rgba(0,184,212,0.05)' } }} component={Link} to="/revoke">Revoke</Button>
              <Button sx={{ color: '#555568', fontWeight: 600, '&:hover': { color: '#00b8d4', background: 'rgba(0,184,212,0.05)' } }} component={Link} to="/batch-issue">Batch</Button>
            </>
          )}

          {/* PUBLIC OR ANY ROLE */}
          <Button sx={{ color: '#555568', fontWeight: 600, '&:hover': { color: '#00b8d4', background: 'rgba(0,184,212,0.05)' } }} component={Link} to="/verify">Verify</Button>
          
          {/* LOGGED IN ROLES EXCLUDING RECRUITERS  */}
          {account && userRole !== ROLES.NONE && (
            <Button sx={{ color: '#555568', fontWeight: 600, '&:hover': { color: '#00b8d4', background: 'rgba(0,184,212,0.05)' } }} component={Link} to="/my-certificates">My Certificates</Button>
          )}

          {/* ADMIN / REGULATORY ONLY */}
          {(userRole === ROLES.GOVERNMENT || userRole === ROLES.REGULATORY) && (
            <Button sx={{ color: '#555568', fontWeight: 600, '&:hover': { color: '#00b8d4', background: 'rgba(0,184,212,0.05)' } }} component={Link} to="/manage-roles">Manage Roles</Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>

          {account && (
            <>
              <Select
                value={network}
                onChange={(e) => switchNetwork(e.target.value)}
                size="small"
                sx={{ 
                  color: '#1a1a2e', 
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  fontWeight: 600,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.15)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00b8d4' }
                }}
              >
                {Object.keys(NETWORKS).map((key) => (
                  <MenuItem key={key} value={key}>
                    {NETWORKS[key].name}
                  </MenuItem>
                ))}
              </Select>

              <Chip
                label={ROLE_NAMES[userRole]}
                sx={{ background: 'rgba(101, 31, 255, 0.1)', color: '#651fff', border: '1px solid rgba(101, 31, 255, 0.3)', fontWeight: 700 }}
                size="medium"
              />

              <Chip
                icon={<AccountBalanceWalletIcon style={{ color: '#00b8d4' }} />}
                label={`${account.slice(0, 6)}...${account.slice(-4)}`}
                sx={{ background: 'rgba(0, 184, 212, 0.1)', color: '#008ba3', border: '1px solid rgba(0, 184, 212, 0.3)', fontWeight: 700 }}
              />

              <Button
                variant="outlined"
                size="small"
                onClick={disconnectWallet}
                sx={{ ml: 1, borderColor: 'rgba(0,0,0,0.1)', color: '#f44336', '&:hover': { borderColor: '#f44336', background: 'rgba(244,67,54,0.05)' } }}
              >
                Disconnect
              </Button>
            </>
          )}

          {!account && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AccountBalanceWalletIcon />}
              component={Link}
              to="/login"
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}