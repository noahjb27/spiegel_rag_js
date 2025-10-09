// frontend/src/components/KeywordAnalysisPanel.tsx
// ==============================================================================
// Component for keyword analysis functionality matching the Gradio version.
// ==============================================================================
'use client';

import React, { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Button,
    Accordion, AccordionSummary, AccordionDetails, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Slider
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon, Search as SearchIcon
} from '@mui/icons-material';
import apiService from '@/lib/api';
import { KeywordAnalysisSkeleton } from './SkeletonLoader';

// Type for keyword analysis results
type KeywordAnalysisResult = {
    [key: string]: {
        word: string;
        similarity: number;
        frequency: number;
    }[];
};

export const KeywordAnalysisPanel = () => {
    const [searchWord, setSearchWord] = useState('mauer');
    const [factor, setFactor] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<KeywordAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!searchWord.trim()) {
            setError('Bitte geben Sie ein Suchwort ein.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults(null);

        try {
            const response = await apiService.get('/api/keywords/expand', {
                params: { 
                    expression: searchWord.trim(), 
                    factor: factor 
                }
            });
            setResults(response.data);
        } catch (err: unknown) {
            console.error('Keyword analysis failed:', err);
            setError('Fehler bei der Schlüsselwort-Analyse.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <KeywordAnalysisSkeleton />;
    }

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Typography variant="h2" gutterBottom sx={{ color: 'primary.light' }}>
                🔍 Schlüsselwort-Analyse
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                Finden Sie semantisch ähnliche Wörter zu einem Suchbegriff. 
                Diese Funktion nutzt FastText-Worteinbettungen, um verwandte Begriffe zu identifizieren.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
                <TextField
                    label="Suchwort"
                    value={searchWord}
                    onChange={(e) => setSearchWord(e.target.value)}
                    fullWidth
                    placeholder="z.B. mauer, berlin, politik"
                    helperText="Geben Sie ein Wort ein, zu dem Sie ähnliche Begriffe finden möchten."
                    variant="outlined"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}
                />

                <Box>
                    <Typography gutterBottom variant="body2">
                        Anzahl ähnlicher Wörter: <Typography component="span" color="primary.main" sx={{ fontWeight: 'bold', fontSize: '1.1em' }}>{factor}</Typography>
                    </Typography>
                    <Slider
                        value={factor}
                        onChange={(e, value) => setFactor(value as number)}
                        min={1}
                        max={20}
                        step={1}
                        valueLabelDisplay="auto"
                        marks
                        sx={{
                            '& .MuiSlider-thumb': {
                                width: { xs: 24, sm: 20 },
                                height: { xs: 24, sm: 20 },
                            },
                            '& .MuiSlider-track': {
                                height: { xs: 6, sm: 4 },
                            },
                            '& .MuiSlider-rail': {
                                height: { xs: 6, sm: 4 },
                            },
                        }}
                    />
                </Box>

                <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={isLoading || !searchWord.trim()}
                    startIcon={<SearchIcon />}
                    sx={{ 
                        py: { xs: 2, sm: 1.5 },
                        fontSize: { xs: '1.1rem', sm: '1rem' },
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                        '&:hover': {
                            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                            boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                            transform: 'translateY(-2px)',
                        },
                        '&:disabled': {
                            background: 'rgba(255, 255, 255, 0.12)',
                            color: 'rgba(255, 255, 255, 0.3)',
                        }
                    }}
                >
                    🔍 Ähnliche Wörter finden
                </Button>

                {error && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                )}

                {results && (
                    <Accordion defaultExpanded sx={{ borderRadius: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                📊 Ergebnisse für {`"${searchWord}"`} ({Object.values(results)[0]?.length || 0} ähnliche Wörter)
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer 
                                component={Paper} 
                                variant="outlined"
                                sx={{ 
                                    maxHeight: { xs: 400, sm: 500 },
                                    overflowX: 'auto',
                                    borderRadius: 2
                                }}
                            >
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
                                                🔤 Ähnliches Wort
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
                                                📈 Ähnlichkeit
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
                                                📊 Häufigkeit
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(results).map(([term, similarWords]) =>
                                            similarWords.map((item, index) => (
                                                <TableRow 
                                                    key={`${term}-${item.word}-${index}`}
                                                    sx={{
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(33, 150, 243, 0.05)'
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 500 }}>{item.word}</TableCell>
                                                    <TableCell align="right">
                                                        <Typography 
                                                            component="span" 
                                                            variant="body2"
                                                            sx={{ 
                                                                color: item.similarity > 0.8 ? 'success.main' : 
                                                                       item.similarity > 0.6 ? 'warning.main' : 
                                                                       item.similarity > 0.4 ? 'info.main' : 'text.secondary',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            {item.similarity.toFixed(3)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {item.frequency?.toLocaleString('de-DE') || 'N/A'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            
                            <Box sx={{ 
                                mt: 2, 
                                p: 2, 
                                bgcolor: 'rgba(33, 150, 243, 0.1)', 
                                borderRadius: 2,
                                border: '1px solid rgba(33, 150, 243, 0.2)'
                            }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                                    💡 Verwendungstipp:
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                    Diese ähnlichen Wörter können Sie in booleschen Suchausdrücken verwenden, 
                                    um Ihre Suche zu erweitern. Beispiel: {`"mauer OR grenze OR wall"`} für eine breitere Suche.
                                </Typography>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                )}
            </Box>
        </Paper>
    );
};
