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
    const isSelected = selectedChunkIds.includes(chunk.id);

    return (
        <Paper 
            variant="outlined" 
            sx={{ 
                p: { xs: 1.5, sm: 2 }, 
                mb: 1.5,
                borderRadius: 2,
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                backgroundColor: isSelected ? 'rgba(215, 84, 37, 0.05)' : 'background.paper',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    borderColor: 'primary.light',
                    backgroundColor: isSelected ? 'rgba(215, 84, 37, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 2 } }}>
                <Checkbox 
                    checked={isSelected} 
                    onChange={() => toggleChunkSelection(chunk.id)}
                    sx={{ 
                        mt: 0.5,
                        '& .MuiSvgIcon-root': { 
                            fontSize: { xs: '1.2rem', sm: '1.5rem' } 
                        }
                    }}
                />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography 
                        variant="h6" 
                        component="h3" 
                        sx={{
                            fontWeight: 'bold',
                            fontSize: { xs: '1rem', sm: '1.1rem' },
                            lineHeight: 1.3,
                            mb: 1,
                            color: isSelected ? 'primary.light' : 'text.primary'
                        }}
                    >
                        {chunk.metadata.Artikeltitel || 'Unbekannter Titel'}
                    </Typography>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 0.5, sm: 2 },
                        flexWrap: 'wrap'
                    }}>
                        <Typography variant="body2" color="text.secondary">
                            📅 {chunk.metadata.Datum || 'N/A'}
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: chunk.relevance_score > 0.7 ? 'success.main' : 
                                       chunk.relevance_score > 0.5 ? 'warning.main' : 'text.secondary',
                                fontWeight: 500
                            }}
                        >
                            🎯 Relevanz: {chunk.relevance_score.toFixed(3)}
                        </Typography>
                        {chunk.llm_evaluation_score && (
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: chunk.llm_evaluation_score > 0.7 ? 'success.main' : 
                                           chunk.llm_evaluation_score > 0.5 ? 'warning.main' : 'text.secondary',
                                    fontWeight: 500
                                }}
                            >
                                🤖 LLM-Score: {chunk.llm_evaluation_score.toFixed(3)}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    size="small"
                    variant={isExpanded ? 'contained' : 'outlined'}
                    sx={{ 
                        minWidth: { xs: 60, sm: 80 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        flexShrink: 0
                    }}
                >
                    {isExpanded ? 'Weniger' : 'Mehr'}
                </Button>
            </Box>
             <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography 
                        variant="body2" 
                        sx={{
                            p: { xs: 1.5, sm: 2 }, 
                            bgcolor: 'rgba(255, 255, 255, 0.02)', 
                            borderRadius: 2, 
                            whiteSpace: 'pre-wrap', 
                            maxHeight: { xs: 250, sm: 350 }, 
                            overflowY: 'auto',
                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                            lineHeight: 1.6,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontFamily: 'Georgia, serif' // Better readability for content
                        }}
                    >
                        {chunk.content}
                    </Typography>
                    {chunk.llm_evaluation_text && (
                        <Box sx={{ 
                            mt: 2, 
                            p: { xs: 1.5, sm: 2 }, 
                            bgcolor: 'rgba(33, 150, 243, 0.1)', 
                            borderRadius: 2, 
                            border: '1px solid', 
                            borderColor: 'info.main'
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'info.light' }}>
                                🤖 KI-Bewertung:
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                                {chunk.llm_evaluation_text}
                            </Typography>
                        </Box>
                    )}
                </Box>
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
                    <Paper sx={{ 
                        p: { xs: 1.5, sm: 2 }, 
                        background: 'linear-gradient(135deg, rgba(215, 84, 37, 0.1) 0%, rgba(178, 176, 105, 0.1) 100%)',
                        border: '1px solid rgba(215, 84, 37, 0.2)',
                        borderRadius: 2
                    }}>
                        {/* Mobile-first layout */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 2, sm: 1 },
                            alignItems: { xs: 'stretch', sm: 'center' }
                        }}>
                            {/* Selection controls */}
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                flexShrink: 0
                            }}>
                                <IconButton 
                                    onClick={() => allSelected || someSelected ? deselectAllChunks() : selectAllChunks()} 
                                    title="Alle auswählen/abwählen"
                                    sx={{ 
                                        bgcolor: 'rgba(215, 84, 37, 0.1)',
                                        '&:hover': { bgcolor: 'rgba(215, 84, 37, 0.2)' },
                                        border: '1px solid rgba(215, 84, 37, 0.3)'
                                    }}
                                >
                                     {allSelected ? <CheckBoxIcon color="primary" /> : someSelected ? <IndeterminateCheckBoxIcon color="primary" /> : <CheckBoxOutlineBlankIcon />}
                                </IconButton>
                                <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 'fit-content' }}>
                                    <Typography component="span" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                        {selectedChunkIds.length}
                                    </Typography>
                                    {' '} / {searchResults.chunks.length} ausgewählt
                                </Typography>
                            </Box>
                            
                            {/* Spacer for desktop */}
                            <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
                            
                            {/* Action buttons */}
                            <Box sx={{ 
                                display: 'flex', 
                                gap: 1,
                                flexDirection: { xs: 'column', sm: 'row' },
                                width: { xs: '100%', sm: 'auto' }
                            }}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    gap: 1,
                                    width: { xs: '100%', sm: 'auto' }
                                }}>
                                    <Button 
                                        onClick={() => downloadResults('csv')} 
                                        size="small" 
                                        startIcon={<DownloadIcon />}
                                        variant="outlined"
                                        sx={{ flex: { xs: 1, sm: 'none' } }}
                                    >
                                        CSV
                                    </Button>
                                    <Button 
                                        onClick={() => downloadResults('json')} 
                                        size="small" 
                                        startIcon={<DownloadIcon />}
                                        variant="outlined"
                                        sx={{ flex: { xs: 1, sm: 'none' } }}
                                    >
                                        JSON
                                    </Button>
                                </Box>
                                <Button 
                                    variant="contained" 
                                    size="small" 
                                    endIcon={<ArrowForwardIcon />} 
                                    onClick={transferChunksForAnalysis} 
                                    disabled={selectedChunkIds.length === 0}
                                    sx={{ 
                                        minWidth: { xs: '100%', sm: 200 },
                                        fontWeight: 600,
                                        background: 'linear-gradient(45deg, #d75425 30%, #e36842 90%)',
                                        '&:hover': {
                                            background: 'linear-gradient(45deg, #b8421a 30%, #d75425 90%)',
                                        },
                                        '&:disabled': {
                                            background: 'rgba(255, 255, 255, 0.12)',
                                            color: 'rgba(255, 255, 255, 0.3)',
                                        }
                                    }}
                                >
                                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        Auswahl in Analyse übertragen
                                    </Box>
                                    <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                                        Zur Analyse
                                    </Box>
                                </Button>
                            </Box>
                        </Box>
                    </Paper>

                    {searchResults.chunks.map(chunk => <ChunkItem key={chunk.id} chunk={chunk} />)}
                </AccordionDetails>
             </Accordion>
        </Box>
    );
};
