// frontend/src/components/Footer.tsx
// ==============================================================================
// Footer component with organization info, last updated date, and license
// ==============================================================================
'use client';

import React from 'react';
import { Box, Typography, Link, Divider, Container } from '@mui/material';
import { School, Update, Gavel } from '@mui/icons-material';

export const Footer = () => {
  return (
    <Box 
      component="footer" 
      sx={{ 
        bgcolor: 'background.paper', 
        mt: 6, 
        py: 3, 
        borderTop: 1, 
        borderColor: 'divider' 
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2
        }}>
          {/* Organization Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School color="primary" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Entwickelt am{' '}
              <Link 
                href="https://www.geschichte.hu-berlin.de/de/bereiche-und-lehrstuehle/digital-history" 
                target="_blank" 
                rel="noopener noreferrer"
                color="primary"
                underline="hover"
              >
                Lehrstuhl für Digital History
              </Link>
              {' '}der Humboldt-Universität zu Berlin
            </Typography>
          </Box>

          {/* Center section with dividers for larger screens */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            alignItems: 'center', 
            gap: 2 
          }}>
            <Divider orientation="vertical" flexItem />
          </Box>

          {/* Last Updated */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Update color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Zuletzt aktualisiert: September 2025
            </Typography>
          </Box>

          {/* License Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Gavel color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              <Link 
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/" 
                target="_blank" 
                rel="noopener noreferrer"
                color="primary"
                underline="hover"
              >
                CC BY-NC-SA 4.0
              </Link>
            </Typography>
          </Box>
        </Box>

        {/* Additional info for smaller screens */}
        <Box sx={{ 
          display: { xs: 'block', md: 'none' }, 
          mt: 2, 
          pt: 2, 
          borderTop: 1, 
          borderColor: 'divider' 
        }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            SPIEGEL RAG System • Forschungsprojekt zur digitalen Archivanalyse
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
