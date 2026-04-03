import React, { useRef } from 'react';
import { Box, Typography, Button, Tooltip } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

/**
 * Universal Branded QR Component
 * @param {string} certId - The blockchain certificate ID
 * @param {number} size - Pixel size of the QR
 */
export default function BrandedQR({ certId, decryptionKey, size = 180 }) {
  const qrRef = useRef();
  
  // Generate the deep-link based on the current domain
  let verifyUrl = `${window.location.protocol}//${window.location.host}/verify?id=${certId}`;
  if (decryptionKey) {
    verifyUrl += `#key=${decryptionKey}`;
  }

  const downloadQR = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size * 2; // High res
      canvas.height = size * 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `BlockCert_QR_${certId.slice(0, 8)}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
  };

  return (
    <Box sx={{ p: 3, background: '#FCFBF7', borderRadius: '24px', border: '1px solid #E5E1D1' }}>
      <Box ref={qrRef} sx={{ position: 'relative', display: 'inline-block' }}>
        <Box 
          sx={{ 
            p: 2, 
            background: '#ffffff', 
            display: 'inline-block', 
            borderRadius: '20px', 
            border: '2px solid #8B1D1D',
            boxShadow: '0 12px 40px rgba(139, 29, 29, 0.1)'
          }}
        >
          <QRCodeSVG
            value={verifyUrl}
            size={size}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: "https://cdn-icons-png.flaticon.com/512/3233/3233514.png",
              height: size * 0.22,
              width: size * 0.22,
              excavate: true,
            }}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 900, color: '#1A0D0D', letterSpacing: '1px' }}>
            UNIVERSAL VERIFICATION TOKEN
          </Typography>
          <Tooltip title="During development, access the site via your Local IP or a Public Tunnel (like Ngrok) for mobile scanning to work.">
            <InfoIcon sx={{ fontSize: 14, color: '#666', cursor: 'pointer' }} />
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Button 
            size="small" 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={downloadQR}
            sx={{ fontWeight: 800, borderRadius: '8px' }}
          >
            Download PNG
          </Button>
          <Button 
            size="small" 
            variant="text" 
            startIcon={<ContentCopyIcon />}
            onClick={copyLink}
            sx={{ fontWeight: 800, color: '#666' }}
          >
            Copy Link
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
