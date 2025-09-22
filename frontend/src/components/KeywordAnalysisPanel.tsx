// frontend/src/components/KeywordAnalysisPanel.tsx
// ==============================================================================
// Component for keyword analysis functionality matching the Gradio version.
// ==============================================================================
'use client';

import React, { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Button, CircularProgress, 
    Accordion, AccordionSummary, AccordionDetails, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Slider, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon, Search as SearchIcon, AutoFixHigh as AutoFixHighIcon
} from '@mui/icons-material';
import apiService from '@/lib/api';

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
        } catch (err: any) {
            console.error('Keyword analysis failed:', err);
            setError(err.response?.data?.error || 'Fehler bei der Schlüsselwort-Analyse.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h2" gutterBottom>
                Schlüsselwort-Analyse
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
                Finden Sie semantisch ähnliche Wörter zu einem Suchbegriff. 
                Diese Funktion nutzt FastText-Worteinbettungen, um verwandte Begriffe zu identifizieren.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                    label="Suchwort"
                    value={searchWord}
                    onChange={(e) => setSearchWord(e.target.value)}
                    fullWidth
                    placeholder="z.B. mauer, berlin, politik"
                    helperText="Geben Sie ein Wort ein, zu dem Sie ähnliche Begriffe finden möchten."
                />

                <Box>
                    <Typography gutterBottom variant="body2">
                        Anzahl ähnlicher Wörter: <Typography component="span" color="primary.main" sx={{ fontWeight: 'bold' }}>{factor}</Typography>
                    </Typography>
                    <Slider
                        value={factor}
                        onChange={(e, value) => setFactor(value as number)}
                        min={1}
                        max={20}
                        step={1}
                        valueLabelDisplay="auto"
                        marks
                    />
                </Box>

                <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                    sx={{ py: 1.5 }}
                >
                    {isLoading ? 'Analysiere...' : 'Ähnliche Wörter finden'}
                </Button>

                {error && (
                    <Alert severity="error">{error}</Alert>
                )}

                {results && (
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>
                                Ergebnisse für "{searchWord}" ({Object.values(results)[0]?.length || 0} ähnliche Wörter)
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Ähnliches Wort</strong></TableCell>
                                            <TableCell align="right"><strong>Ähnlichkeit</strong></TableCell>
                                            <TableCell align="right"><strong>Häufigkeit</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(results).map(([term, similarWords]) =>
                                            similarWords.map((item, index) => (
                                                <TableRow key={`${term}-${item.word}-${index}`}>
                                                    <TableCell>{item.word}</TableCell>
                                                    <TableCell align="right">
                                                        {item.similarity.toFixed(3)}
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
                            
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Verwendung:</strong> Diese ähnlichen Wörter können Sie in booleschen Suchausdrücken verwenden, 
                                    um Ihre Suche zu erweitern. Beispiel: "mauer OR grenze OR wall" für eine breitere Suche.
                                </Typography>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                )}
            </Box>
        </Paper>
    );
};
