import React, { useState, useContext } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { EthereumContext } from '../context/EthereumContext';
import { ethers } from 'ethers';
import axios from 'axios';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { zlibSync } from 'fflate';

export default function IssueCertificate() {
  const { contract, network } = useContext(EthereumContext);
  const [formData, setFormData] = useState({
    studentAddress: '',
    expiryYears: '1'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!selectedFile) {
        throw new Error("Please select a Certificate Document to upload.");
      }
      if (!formData.studentAddress || !ethers.utils.isAddress(formData.studentAddress)) {
        throw new Error("Please enter a valid Ethereum address (0x...).");
      }
      if (!process.env.REACT_APP_PINATA_JWT) {
        throw new Error("Pinata JWT is missing in the .env configuration!");
      }

      // 1. Prepare raw File Data
      const arrayBuffer = await selectedFile.arrayBuffer();
      const rawUint8 = new Uint8Array(arrayBuffer);

      // 2. High-speed Compression natively in browser
      const compressedData = zlibSync(rawUint8);

      // 3. ChaCha20-Poly1305 Encryption
      const key = new Uint8Array(32);
      window.crypto.getRandomValues(key);
      const nonce = new Uint8Array(12);
      window.crypto.getRandomValues(nonce);

      const chacha = chacha20poly1305(key, nonce);
      const ciphertext = chacha.encrypt(compressedData);

      // 4. Prepend 12-byte Nonce to the Ciphertext for deterministic decryption
      const finalPayload = new Uint8Array(12 + ciphertext.length);
      finalPayload.set(nonce, 0);
      finalPayload.set(ciphertext, 12);

      // 5. Upload purely Encrypted Blob to IPFS via Pinata
      const encryptedBlob = new Blob([finalPayload], { type: 'application/octet-stream' });
      const encryptedFile = new File([encryptedBlob], `${selectedFile.name}.encrypted`, { type: 'application/octet-stream' });
      
      const pinataData = new FormData();
      pinataData.append('file', encryptedFile);

      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", pinataData, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT}`
        }
      });
      const generatedCID = res.data.IpfsHash;

      // Format Hex Key to dynamically present to user
      const hexDecryptionKey = Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('');

      // 6. Create certificate hash
      const certHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(
          formData.studentAddress + generatedCID + Date.now()
        )
      );

      // 3. Calculate expiry date
      const expiryDate = Math.floor(Date.now() / 1000) + 
        (parseInt(formData.expiryYears) * 365 * 24 * 60 * 60);

      // 4. Issue certificate on Blockchain
      const tx = await contract.issueCertificate(
        generatedCID,
        certHash,
        formData.studentAddress,
        expiryDate
      );

      const receipt = await tx.wait();
      
      if (!receipt.logs || receipt.logs.length === 0) {
        throw new Error("Transaction succeeded but no logs were emitted. This happens if the frontend is connected to an old/empty contract address. Please hard refresh the page (Cmd+R or Ctrl+R) to load the new configuration.");
      }

      // Get certificate ID from event
      const certId = receipt.logs[0].topics[1];

      setResult({
        certId,
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        decryptionKey: hexDecryptionKey
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      // Suppress the non-fatal ENS "UNSUPPORTED_OPERATION" error that ethers v5
      // fires on Hardhat / custom networks. The transaction still succeeds.
      if (err.code === 'UNSUPPORTED_OPERATION' && err.operation === 'getResolver') {
        setLoading(false);
        return;
      }
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }} className="animate-fade-in-up stagger-1">
      <Paper elevation={0} sx={{ p: { xs: 4, md: 6 } }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, fontWeight: 800 }}>
          <span style={{ fontSize: '1.2em' }}>📝</span> Issue New Certificate
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Student Ethereum Address"
            value={formData.studentAddress}
            onChange={(e) => setFormData({ ...formData, studentAddress: e.target.value })}
            margin="normal"
            required
            placeholder="0x..."
          />

          <TextField
            fullWidth
            type="file"
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: "image/*, application/pdf" }}
            label="Certificate Document (PDF/Image)"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            type="number"
            label="Validity Period (Years)"
            value={formData.expiryYears}
            onChange={(e) => setFormData({ ...formData, expiryYears: e.target.value })}
            margin="normal"
            required
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Issue Certificate'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 4 }}>
            <Alert severity="success">
              Certificate issued successfully!
            </Alert>

            <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Certificate Details
              </Typography>
              <Typography variant="body2">
                <strong>Certificate ID:</strong> {result.certId}
              </Typography>
              <Typography variant="body2">
                <strong>Transaction Hash:</strong> {result.txHash}
              </Typography>
              <Typography variant="body2">
                <strong>Gas Used:</strong> {result.gasUsed}
              </Typography>

              <Box sx={{ mt: 3, p: 2, background: 'rgba(124, 77, 255, 0.1)', border: '1px solid rgba(124, 77, 255, 0.3)', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#00b8d4', fontWeight: 'bold' }}>
                  🔒 Certificate Payload Encrypted!
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#a0aab2' }}>
                  The physical file was automatically <strong>High-Ratio Compressed</strong> and <strong>ChaCha20-Poly1305 Encrypted</strong> before hitting IPFS.
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, wordBreak: 'break-all', fontFamily: 'monospace', p: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 1 }}>
                  <strong>Decryption Key:</strong> {result.decryptionKey}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#ffb74d' }}>
                  ⚠️ Save this key securely. Give it strictly to verified Recruiters/Students to allow them to open the physical document.
                </Typography>
              </Box>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>
                  QR Code for Verification
                </Typography>
                <QRCodeSVG
                  value={JSON.stringify({
                    certId: result.certId,
                    network: network
                  })}
                  size={200}
                />
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
}