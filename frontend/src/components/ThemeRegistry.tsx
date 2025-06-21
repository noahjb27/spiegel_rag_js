// frontend/src/components/ThemeRegistry.tsx
// ==============================================================================
// Required setup file for using Material-UI with the Next.js App Router.
// ==============================================================================
'use client';

import * as React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Your theme definition from before
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#d75425', contrastText: '#ffffff' },
        secondary: { main: '#b2b069' },
        background: { default: '#1a1a1a', paper: '#2d2d2d' },
        text: { primary: '#ffffff', secondary: '#e5e5e5' },
        error: { main: '#ef4444' },
        success: { main: '#22c55e' },
    },
    typography: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        h1: {
            fontSize: '2rem',
            fontWeight: 700,
            borderBottom: '3px solid #d75425',
            paddingBottom: '12px',
            marginBottom: '16px',
        },
        h2: {
            fontSize: '1.5rem',
            fontWeight: 600,
            margin: '24px 0 16px 0',
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
