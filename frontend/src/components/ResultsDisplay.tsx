// frontend/src/components/ResultsDisplay.tsx
// ==============================================================================
// Component to display search results and handle selection.
// ==============================================================================
'use client';

import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, Checkbox, Button, CircularProgress, Accordion,
    AccordionSummary, AccordionDetails, Collapse, IconButton, Alert,
    FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon, CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    IndeterminateCheckBox as IndeterminateCheckBoxIcon,
    Download as DownloadIcon, ArrowForward as ArrowForwardIcon,
    OpenInNew as OpenInNewIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';
import { Chunk } from '@/types';

// Helper function to extract year from date string
const extractYear = (dateStr: string | undefined): number | null => {
    if (!dateStr) return null;
    const match = dateStr.match(/\d{4}/);
    return match ? parseInt(match[0]) : null;
};

// Helper function to safely parse dates
const parseDateSafely = (dateStr: string | undefined): number => {
    if (!dateStr) return 0;
    const timestamp = new Date(dateStr).getTime();
    return isNaN(timestamp) ? 0 : timestamp;
};

// Timeline visualization component
const TimelineVisualization = ({ chunks }: { chunks: Chunk[] }) => {
    const MIN_YEAR = 1948;
    const MAX_YEAR = 1979;

    // Count chunks per year
    const yearCounts: Record<number, number> = {};
    for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
        yearCounts[year] = 0;
    }

    chunks.forEach(chunk => {
        const year = extractYear(chunk.metadata.Datum);
        if (year && year >= MIN_YEAR && year <= MAX_YEAR) {
            yearCounts[year]++;
        }
    });

    const maxCount = Math.max(...Object.values(yearCounts), 1);
    const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

    return (
        <Paper sx={{
            p: 2,
            mb: 2,
            background: 'linear-gradient(135deg, rgba(215, 84, 37, 0.05) 0%, rgba(178, 176, 105, 0.05) 100%)',
            border: '1px solid rgba(215, 84, 37, 0.2)'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TimelineIcon color="primary" />
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    Zeitliche Verteilung der Quellen
                </Typography>
            </Box>

            <Box sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: { xs: 0.25, sm: 0.5 },
                height: 80,
                px: 1
            }}>
                {years.map(year => {
                    const count = yearCounts[year];
                    const height = maxCount > 0 ? (count / maxCount) * 60 : 0;
                    const isDecade = year % 10 === 0;

                    return (
                        <Box
                            key={year}
                            sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 0.5
                            }}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    height: height,
                                    bgcolor: count > 0 ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '2px 2px 0 0',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: count > 0 ? 'primary.light' : 'rgba(255, 255, 255, 0.2)',
                                        transform: 'scaleY(1.1)',
                                    },
                                    cursor: count > 0 ? 'pointer' : 'default',
                                    position: 'relative'
                                }}
                                title={`${year}: ${count} Quelle${count !== 1 ? 'n' : ''}`}
                            />
                            {isDecade && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                        fontWeight: 'bold',
                                        color: 'text.secondary'
                                    }}
                                >
                                    {year}
                                </Typography>
                            )}
                        </Box>
                    );
                })}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                {chunks.length} Quellen über {MAX_YEAR - MIN_YEAR + 1} Jahre (1948-1979)
            </Typography>
        </Paper>
    );
};

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
                            mb: 0.5,
                            color: isSelected ? 'primary.light' : 'text.primary'
                        }}
                    >
                        {chunk.metadata.Artikeltitel || 'Unbekannter Titel'}
                    </Typography>
                    {chunk.metadata.Untertitel && (
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontSize: { xs: '0.875rem', sm: '0.9rem' },
                                color: 'text.secondary',
                                fontStyle: 'italic',
                                mb: 1
                            }}
                        >
                            {chunk.metadata.Untertitel}
                        </Typography>
                    )}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 0.5, sm: 2 },
                        flexWrap: 'wrap',
                        mt: 1
                    }}>
                        {chunk.metadata.Textsorte && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'info.light',
                                    fontWeight: 500,
                                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1
                                }}
                            >
                                📝 {chunk.metadata.Textsorte}
                            </Typography>
                        )}
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
                        {chunk.metadata.URL && (
                            <Button
                                component="a"
                                href={chunk.metadata.URL as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                                startIcon={<OpenInNewIcon />}
                                sx={{
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    color: 'primary.light',
                                    '&:hover': {
                                        backgroundColor: 'rgba(215, 84, 37, 0.1)'
                                    }
                                }}
                            >
                                Artikel öffnen
                            </Button>
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


type SortOption = 'relevance' | 'date' | 'llm-score';

export const ResultsDisplay = () => {
    const {
        searchResults, isSearching, searchError, selectedChunkIds,
        selectAllChunks, deselectAllChunks,
        transferChunksForAnalysis, downloadResults
    } = useAppStore();

    const [sortBy, setSortBy] = useState<SortOption>('relevance');

    // Sort chunks based on selected option (memoized for performance)
    // IMPORTANT: This must be called before any conditional returns to follow Rules of Hooks
    const sortedChunks = useMemo(() => {
        if (!searchResults) return [];
        return [...searchResults.chunks].sort((a, b) => {
            switch (sortBy) {
                case 'relevance':
                    return b.relevance_score - a.relevance_score;
                case 'date':
                    // Parse dates safely and sort (newest first)
                    const dateA = parseDateSafely(a.metadata.Datum);
                    const dateB = parseDateSafely(b.metadata.Datum);
                    return dateB - dateA;
                case 'llm-score':
                    // Sort by LLM score if available, fallback to relevance
                    const scoreA = a.llm_evaluation_score ?? a.relevance_score;
                    const scoreB = b.llm_evaluation_score ?? b.relevance_score;
                    return scoreB - scoreA;
                default:
                    return 0;
            }
        });
    }, [searchResults, sortBy]);

    const handleSortChange = (event: SelectChangeEvent<SortOption>) => {
        setSortBy(event.target.value as SortOption);
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

                            {/* Sort dropdown */}
                            <FormControl
                                size="small"
                                sx={{
                                    minWidth: { xs: '100%', sm: 150 },
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    }
                                }}
                            >
                                <InputLabel id="sort-select-label">Sortieren nach</InputLabel>
                                <Select
                                    labelId="sort-select-label"
                                    value={sortBy}
                                    label="Sortieren nach"
                                    onChange={handleSortChange}
                                >
                                    <MenuItem value="relevance">Relevanz</MenuItem>
                                    <MenuItem value="date">Datum</MenuItem>
                                    <MenuItem value="llm-score">LLM-Score</MenuItem>
                                </Select>
                            </FormControl>

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

                    <TimelineVisualization chunks={searchResults.chunks} />

                    {sortedChunks.map(chunk => <ChunkItem key={chunk.id} chunk={chunk} />)}
                </AccordionDetails>
             </Accordion>
        </Box>
    );
};
