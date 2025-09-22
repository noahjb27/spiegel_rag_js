// ==============================================================================
// frontend/src/app/page.tsx
// ==============================================================================
// This is the main page component that renders the tab layout and panels.
// ==============================================================================
'use client';

import React from 'react';
import { Container, Box, Tabs, Tab, Typography } from '@mui/material';
import { Science, FindInPage, Info, AutoFixHigh } from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';

// We will create these component files next
import { SearchPanel } from '@/components/SearchPanel';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { KeywordAnalysisPanel } from '@/components/KeywordAnalysisPanel';
import { InfoPanel } from '@/components/InfoPanel';
import { Footer } from '@/components/Footer';

export default function HomePage() {
    const { activeTab, setActiveTab } = useAppStore();
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <>
        <Container maxWidth="lg" sx={{ my: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
                textAlign: 'center', 
                mb: { xs: 3, sm: 4 },
                position: 'relative'
            }}>
                <Typography 
                    variant="h1" 
                    component="h1"
                    sx={{
                        background: 'linear-gradient(45deg, #d75425, #e36842)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        textShadow: '0 2px 4px rgba(215, 84, 37, 0.3)'
                    }}
                >
                    SPIEGEL RAG System
                </Typography>
                <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                        mt: 1,
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                >
                    Intelligente Archivanalyse mit KI-Unterstützung
                </Typography>
            </Box>
            
            <Box sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                mb: { xs: 2, sm: 3 },
                position: 'sticky',
                top: 0,
                backgroundColor: 'background.default',
                zIndex: 100,
                pt: 1
            }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                        '& .MuiTab-root': {
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            minHeight: { xs: 48, sm: 48 },
                            '&.Mui-selected': {
                                color: 'primary.main',
                                fontWeight: 600
                            }
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            borderRadius: '3px 3px 0 0'
                        }
                    }}
                >
                    <Tab 
                        label="Heuristik" 
                        icon={<FindInPage />} 
                        iconPosition="start" 
                        sx={{ flexDirection: { xs: 'column', sm: 'row' } }}
                    />
                    <Tab 
                        label="Analyse" 
                        icon={<Science />} 
                        iconPosition="start"
                        sx={{ flexDirection: { xs: 'column', sm: 'row' } }}
                    />
                    <Tab 
                        label="Schlagwort-Analyse" 
                        icon={<AutoFixHigh />} 
                        iconPosition="start"
                        sx={{ flexDirection: { xs: 'column', sm: 'row' } }}
                    />
                    <Tab 
                        label="Info" 
                        icon={<Info />} 
                        iconPosition="start"
                        sx={{ flexDirection: { xs: 'column', sm: 'row' } }}
                    />
                </Tabs>
            </Box>
            
            <Box sx={{ pt: 3 }}>
                {activeTab === 0 && (
                    <>
                        <SearchPanel />
                        <ResultsDisplay />
                    </>
                )}
                {activeTab === 1 && <AnalysisPanel />}
                {activeTab === 2 && <KeywordAnalysisPanel />}
                {activeTab === 3 && <InfoPanel />}
            </Box>
        </Container>
        
        <Footer />
        </>
    );
}