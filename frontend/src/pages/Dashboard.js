import React, { useContext } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import GroupIcon from '@mui/icons-material/Group';
import BatchPredictionIcon from '@mui/icons-material/BatchPrediction';
import { EthereumContext } from '../context/EthereumContext';
import { ROLES, ROLE_NAMES } from '../config/contracts';

export default function Dashboard() {
  const { account, network, userRole } = useContext(EthereumContext);
  const navigate = useNavigate();

  // Authenticated Dashboard Rendering

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, fontWeight: 700 }} className="animate-fade-in-up stagger-1">
        Welcome to BlockCert System
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6} className="animate-fade-in-up stagger-2">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Typography variant="body2">
                <strong>Address:</strong> {account}
              </Typography>
              <Typography variant="body2">
                <strong>Network:</strong> {network}
              </Typography>
              <Typography variant="body2">
                <strong>Role:</strong> {ROLE_NAMES[userRole]}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} className="animate-fade-in-up stagger-3">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Institution Only Options */}
                {userRole === ROLES.INSTITUTION && (
                  <>
                    <Button variant="outlined" startIcon={<SchoolIcon />} onClick={() => navigate('/issue')} fullWidth>
                      Issue Certificate
                    </Button>
                    <Button variant="outlined" startIcon={<BatchPredictionIcon />} onClick={() => navigate('/batch-issue')} fullWidth>
                      Batch Issue
                    </Button>
                  </>
                )}

                {/* Verification is public to any logged in user */}
                <Button variant="outlined" startIcon={<VerifiedIcon />} onClick={() => navigate('/verify')} fullWidth>
                  Verify Certificate
                </Button>

                {/* Admin Only Option */}
                {(userRole === ROLES.GOVERNMENT || userRole === ROLES.REGULATORY) && (
                  <Button variant="outlined" startIcon={<GroupIcon />} onClick={() => navigate('/manage-roles')} fullWidth>
                    Manage Roles
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sx={{ mt: 2 }} className="animate-fade-in-up stagger-4">
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="h6" gutterBottom>
              System Features
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">✅ Role-Based Access Control</Typography>
                <Typography variant="body2" color="text.secondary">
                  5 distinct roles with specific permissions
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">✅ Merkle Tree Batch Issuance</Typography>
                <Typography variant="body2" color="text.secondary">
                  99.5% gas savings on bulk operations
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">✅ ChaCha20 Encryption</Typography>
                <Typography variant="body2" color="text.secondary">
                  Military-grade certificate protection
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">✅ IPFS Storage</Typography>
                <Typography variant="body2" color="text.secondary">
                  Decentralized file storage
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">✅ QR Code Generation</Typography>
                <Typography variant="body2" color="text.secondary">
                  Instant verification via mobile
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">✅ Multi-Network Support</Typography>
                <Typography variant="body2" color="text.secondary">
                  Ganache, Polygon, Ethereum
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}