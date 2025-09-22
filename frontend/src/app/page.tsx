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

export default function HomePage() {
    const { activeTab, setActiveTab } = useAppStore();
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <Typography variant="h1" component="h1">
                SPIEGEL RAG System
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Heuristik" icon={<FindInPage />} iconPosition="start" />
                    <Tab label="Analyse" icon={<Science />} iconPosition="start" />
                    <Tab label="Schlagwort-Analyse" icon={<AutoFixHigh />} iconPosition="start" />
                    <Tab label="Info" icon={<Info />} iconPosition="start" />
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
    );
}