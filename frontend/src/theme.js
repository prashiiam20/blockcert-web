import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#00b8d4', // Slightly darker Cyan for light mode contrast
      dark: '#008ba3',
    },
    secondary: {
      main: '#651fff', // Deep Purple
    },
    background: {
      default: 'transparent', // Handled by App.js animated background
      paper: 'rgba(255, 255, 255, 0.85)',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#555568',
    },
  },
  typography: {
    fontFamily: '"Outfit", sans-serif',
    h3: { fontWeight: 800, color: '#0f0f1a' },
    h4: { fontWeight: 700, letterSpacing: '-0.5px', color: '#0f0f1a' },
    h5: { fontWeight: 700, color: '#1a1a2e' },
    h6: { fontWeight: 600, letterSpacing: '0.2px', color: '#1a1a2e' },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.5px' },
  },
  shape: { borderRadius: 24 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          padding: '12px 28px',
          fontWeight: 700,
          textTransform: 'none',
          fontSize: '1rem',
          letterSpacing: '0.2px',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            transform: 'translateY(-3px) scale(1.02)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00b8d4 0%, #651fff 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 20px -4px rgba(0, 184, 212, 0.4)',
          '&:hover': {
            boxShadow: '0 12px 28px -4px rgba(101, 31, 255, 0.5)',
            background: 'linear-gradient(135deg, #00e5ff 0%, #7c4dff 100%)',
          },
        },
        outlined: {
          border: '2px solid rgba(0, 184, 212, 0.3)',
          background: 'rgba(255,255,255,0.7)',
          color: '#008ba3',
          '&:hover': {
            border: '2px solid #00b8d4',
            backgroundColor: 'rgba(0, 184, 212, 0.08)',
            boxShadow: '0 8px 16px rgba(0, 184, 212, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.08)',
          borderRadius: '24px',
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          background: 'rgba(255,255,255,0.7)',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.12)',
            borderColor: 'rgba(0, 184, 212, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            transition: 'all 0.3s ease',
            '& fieldset': { border: '1px solid rgba(0, 0, 0, 0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(0, 184, 212, 0.5)' },
            '&.Mui-focused fieldset': { border: '2px solid #00b8d4' },
            '&.Mui-focused': { backgroundColor: '#ffffff' },
          },
        },
      },
    },
  },
});

export default theme;
