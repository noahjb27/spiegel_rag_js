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
import { Chunk } from '@/types';

const ChunkItem = ({ chunk }: { chunk: Chunk }) => {
    const { selectedChunkIds, toggleChunkSelection } = useAppStore();
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Checkbox checked={selectedChunkIds.includes(chunk.id)} onChange={() => toggleChunkSelection(chunk.id)} />
                <Box sx={{ flexGrow: 1}}>
                    <Typography variant="body1" component="h3" sx={{fontWeight: 'bold'}}>
                        {chunk.metadata.Artikeltitel || 'Unbekannter Titel'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Datum: {chunk.metadata.Datum || 'N/A'} | Relevanz: {chunk.relevance_score.toFixed(3)}
                        {chunk.llm_evaluation_score && ` | LLM-Score: ${chunk.llm_evaluation_score.toFixed(3)}`}
                    </Typography>
                </Box>
                <Button onClick={() => setIsExpanded(!isExpanded)} size="small">{isExpanded ? 'Weniger' : 'Mehr'}</Button>
            </Box>
             <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Typography variant="body2" sx={{mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto'}}>
                    {chunk.content}
                </Typography>
             </Collapse>
        </Paper>
    );
};


export const ResultsDisplay = () => {
    const { 
        searchResults, isSearching, searchError, selectedChunkIds, 
        selectAllChunks, deselectAllChunks, 
        transferChunksForAnalysis, downloadResults 
    } = useAppStore();
    
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
                        <Button onClick={() => downloadResults('json')} size="small" startIcon={<DownloadIcon />}>Download JSON</Button>
                        <Button variant="contained" size="small" endIcon={<ArrowForwardIcon />} onClick={transferChunksForAnalysis} disabled={selectedChunkIds.length === 0}>
                            Auswahl in Analyse übertragen
                        </Button>
                    </Paper>

                    {searchResults.chunks.map(chunk => <ChunkItem key={chunk.id} chunk={chunk} />)}
                </AccordionDetails>
             </Accordion>
        </Box>
    );
};
