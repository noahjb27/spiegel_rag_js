// frontend/src/components/ResultsDisplay.tsx
// ==============================================================================
// Component to display search results and handle selection.
// ==============================================================================
'use client';

import React, { useState } from 'react';
import {
    Box, Paper, Typography, Checkbox, Button, CircularProgress, Accordion,
    AccordionSummary, AccordionDetails, Collapse, IconButton, Alert
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon, CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    IndeterminateCheckBox as IndeterminateCheckBoxIcon,
    Download as DownloadIcon, ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';

export const ResultsDisplay = () => {
    const { 
        searchResults, isSearching, searchError, selectedChunkIds, 
        toggleChunkSelection, selectAllChunks, deselectAllChunks, 
        transferChunksForAnalysis, downloadResults 
    } = useAppStore();
    
    const [expanded, setExpanded] = useState<{[key: number]: boolean}>({});

    const handleToggleExpand = (chunkId: number) => {
        setExpanded(prev => ({...prev, [chunkId]: !prev[chunkId]}));
    };

    if (isSearching) {
        return <CircularProgress sx={{ display: 'block', margin: '2rem auto' }} />;
    }
    if (searchError) {
        return <Alert severity="error" sx={{mt: 2}}>{searchError}</Alert>;
    }
    if (!searchResults) {
        return <Alert severity="info" sx={{mt: 2}}>Führen Sie eine Suche durch, um Ergebnisse anzuzeigen.</Alert>;
    }
    
    const allSelected = selectedChunkIds.length > 0 && selectedChunkIds.length === searchResults.chunks.length;
    const someSelected = selectedChunkIds.length > 0 && !allSelected;

    return (
        <Box sx={{mt: 4}}>
             <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Gefundene Texte ({searchResults.chunks.length})</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2}}>
                    <Paper sx={{p: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
                        <IconButton onClick={() => allSelected || someSelected ? deselectAllChunks() : selectAllChunks()} title="Alle auswählen/abwählen">
                             {allSelected ? <CheckBoxIcon /> : someSelected ? <IndeterminateCheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                        </IconButton>
                        <Typography variant="body2">{selectedChunkIds.length} / {searchResults.chunks.length} ausgewählt</Typography>
                        <Box sx={{flexGrow: 1}} />
                        <Button onClick={() => downloadResults('csv')} size="small" startIcon={<DownloadIcon />}>Download CSV</Button>
                        <Button variant="contained" size="small" endIcon={<ArrowForwardIcon />} onClick={transferChunksForAnalysis} disabled={selectedChunkIds.length === 0}>
                            Auswahl in Analyse übertragen
                        </Button>
                    </Paper>

                    {searchResults.chunks.map(chunk => (
                        <Paper key={chunk.id} variant="outlined" sx={{ p: 2 }}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <Checkbox checked={selectedChunkIds.includes(chunk.id)} onChange={() => toggleChunkSelection(chunk.id)} />
                                <Box sx={{ flexGrow: 1}}>
                                    <Typography variant="body1" component="h3" sx={{fontWeight: 'bold'}}>
                                        {chunk.metadata.Artikeltitel || 'Unbekannter Titel'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Datum: {chunk.metadata.Datum || 'N/A'} | Relevanz: {chunk.relevance_score.toFixed(3)}
                                    </Typography>
                                </Box>
                                <Button onClick={() => handleToggleExpand(chunk.id)} size="small">{expanded[chunk.id] ? 'Weniger' : 'Mehr'}</Button>
                            </Box>
                             <Collapse in={expanded[chunk.id]} timeout="auto" unmountOnExit>
                                <Typography variant="body2" sx={{mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto'}}>
                                    {chunk.content}
                                </Typography>
                             </Collapse>
                        </Paper>
                    ))}
                </AccordionDetails>
             </Accordion>
        </Box>
    );
};
