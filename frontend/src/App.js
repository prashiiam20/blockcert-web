import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { EthereumProvider, EthereumContext } from './context/EthereumContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import IssueCertificate from './pages/IssueCertificate';
import RevokeCertificate from './pages/RevokeCertificate';
import VerifyCertificate from './pages/VerifyCertificate';
import MyCertificates from './pages/MyCertificates';
import ManageRoles from './pages/ManageRoles';
import BatchIssue from './pages/BatchIssue';
import Login from './pages/Login';

import { Box } from '@mui/material';

function AppContent() {
  const { account } = useContext(EthereumContext);

  return (
    <Router>
      <Navbar />
      
      {/* Hyper-Modern Glowing Animated Background - Light Mode */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, overflow: 'hidden', background: '#f4f7fb' }}>
        <Box sx={{ position: 'absolute', top: '-10%', left: '-5%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(124,77,255,0.1) 0%, transparent 65%)', filter: 'blur(80px)', animation: 'float 15s ease-in-out infinite alternate' }} />
        <Box sx={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 65%)', filter: 'blur(90px)', animation: 'float 18s ease-in-out infinite alternate-reverse' }} />
      </Box>

      <Box sx={{ pt: { xs: 14, md: 18 }, pb: 8, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={account ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/issue" element={account ? <IssueCertificate /> : <Navigate to="/login" />} />
          <Route path="/revoke" element={account ? <RevokeCertificate /> : <Navigate to="/login" />} />
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/my-certificates" element={account ? <MyCertificates /> : <Navigate to="/login" />} />
          <Route path="/manage-roles" element={account ? <ManageRoles /> : <Navigate to="/login" />} />
          <Route path="/batch-issue" element={account ? <BatchIssue /> : <Navigate to="/login" />} />
        </Routes>
      </Box>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <EthereumProvider>
        <AppContent />
      </EthereumProvider>
    </ThemeProvider>
  );
}

export default App;