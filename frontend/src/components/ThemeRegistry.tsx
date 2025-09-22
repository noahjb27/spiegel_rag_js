// frontend/src/components/ThemeRegistry.tsx
// ==============================================================================
// Required setup file for using Material-UI with the Next.js App Router.
// ==============================================================================
'use client';

import * as React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Enhanced theme with improved accessibility and responsive design
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { 
            main: '#d75425', 
            contrastText: '#ffffff',
            // Better contrast ratios
            light: '#e36842',
            dark: '#b8421a'
        },
        secondary: { 
            main: '#b2b069',
            light: '#c4c482',
            dark: '#9a9856'
        },
        background: { 
            default: '#121212', // Better contrast than pure black
            paper: '#1e1e1e' // Softer than previous #2d2d2d
        },
        text: { 
            primary: '#ffffff', 
            secondary: '#b3b3b3' // Better contrast for secondary text
        },
        error: { main: '#f44336' },
        success: { main: '#4caf50' },
        info: { main: '#2196f3' },
        warning: { main: '#ff9800' },
    },
    spacing: 8, // Consistent 8px spacing system
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
        },
    },
    typography: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
        h1: {
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', // Responsive sizing
            fontWeight: 700,
            borderBottom: '3px solid #d75425',
            paddingBottom: '0.75rem',
            marginBottom: '1.5rem',
            lineHeight: 1.2,
        },
        h2: {
            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
            fontWeight: 600,
            marginTop: '2rem',
            marginBottom: '1rem',
            lineHeight: 1.3,
        },
        h3: {
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            fontWeight: 600,
            marginBottom: '0.75rem',
            lineHeight: 1.4,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
    },
    components: {
        // Global component customizations
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Remove default gradient
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none', // Keep original casing
                    borderRadius: '8px',
                    padding: '8px 16px',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    },
                },
                contained: {
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                },
            },
        },
        MuiAccordion: {
            styleOverrides: {
                root: {
                    marginBottom: '8px',
                    '&:last-child': {
                        marginBottom: 0,
                    },
                    '&.Mui-expanded': {
                        marginBottom: '8px',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                    },
                },
            },
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    '& .MuiSlider-thumb': {
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            boxShadow: '0 0 0 8px rgba(215, 84, 37, 0.16)',
                        },
                    },
                },
            },
        },
    },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
