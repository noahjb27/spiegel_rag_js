// frontend/src/components/AnalysisPanel.tsx
// ==============================================================================
// Component for the "Analyse" tab, with full feature parity to the original.
// ==============================================================================
'use client';

import React, { useState } from 'react';
import {
    Box, Paper, Typography, Button, CircularProgress, Accordion,
    AccordionSummary, AccordionDetails, TextField, Alert, List,
    ListItem, ListItemIcon, FormControl, RadioGroup, Radio, FormControlLabel,
    Slider
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon, Science as ScienceIcon
} from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';
import { AnalysisResult } from '@/types';

// Enhanced analysis results display with better typography and mobile support
const AnalysisResultsDisplay = ({ result }: { result: AnalysisResult }) => (
    <Paper 
        elevation={8} 
        sx={{
            p: { xs: 2, sm: 3 }, 
            mt: 4, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)',
            border: '2px solid',
            borderColor: 'success.main',
            position: 'relative',
            '&::before': {
                content: '"🎯"', // might remove later
                position: 'absolute',
                top: { xs: -10, sm: -12 },
                left: { xs: 16, sm: 24 },
                fontSize: { xs: '1.5rem', sm: '2rem' },
                backgroundColor: 'background.paper',
                px: 1,
                borderRadius: '50%'
            }
        }}
    >
        <Typography 
            variant="h2" 
            gutterBottom 
            sx={{ 
                color: 'success.light',
                mb: 3,
                mt: { xs: 1, sm: 0 }
            }}
        >
            Analyse-Ergebnis
        </Typography>
        <Paper
            elevation={2}
            sx={{
                p: { xs: 2, sm: 3 },
                bgcolor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                mb: 3
            }}
        >
            <Typography 
                sx={{
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'Georgia, serif', // Better readability for analysis text
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    lineHeight: 1.7,
                    color: 'text.primary'
                }}
            >
                {result.answer}
            </Typography>
        </Paper>
        <Accordion sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>📊 Metadaten & Statistiken</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 120 }}>🤖 Modell:</Typography>
                        <Typography variant="body2" color="primary.light">{result.metadata.model_used}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 120 }}>⏱️ Analysezeit:</Typography>
                        <Typography variant="body2" color="info.light">{result.metadata.analysis_time.toFixed(2)} Sekunden</Typography>
                    </Box>
                </Box>
            </AccordionDetails>
        </Accordion>
    </Paper>
);

export const AnalysisPanel = () => {
    const { 
        transferredChunks, performAnalysis, isAnalyzing, 
        analysisError, analysisResult 
    } = useAppStore();

    // Local state for the analysis form inputs
    const [params, setParams] = useState({
        user_prompt: 'Wie wurde die Berliner Mauer in den westdeutschen Medien dargestellt?',
        model_selection: 'hu-llm3',
        system_prompt_text: "Du bist ein erfahrener Historiker mit Expertise in der kritischen Auswertung von SPIEGEL-Artikeln aus den Jahren 1948-1979.\n\n**Hauptaufgabe**: Beantworte die Forschungsfrage präzise und wissenschaftlich fundiert basierend ausschließlich auf den bereitgestellten Textauszügen.\n\n**Methodik**:\n* **Quellentreue**: Nutze ausschließlich die bereitgestellten Textauszüge als Grundlage\n* **Wissenschaftliche Präzision**: Formuliere analytisch und differenziert",
        temperature: 0.3
    });

    const handleParamChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setParams(prev => ({...prev, [name!]: value as string}));
    };

    const handleSliderChange = (name: string, value: number | number[]) => {
        setParams(prev => ({...prev, [name]: value as number}));
    };

    const handleAnalyze = () => {
        performAnalysis(params);
    };

    if (transferredChunks.length === 0) {
        return <Alert severity="info" sx={{mt: 2}}>Übertragen Sie zuerst Texte aus der Heuristik-Phase, um die Analyse zu starten.</Alert>
    }

    return (
        <Paper 
            elevation={3} 
            sx={{
                p: { xs: 2, sm: 3 }, 
                mt: 2, 
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%)',
                display: 'flex', 
                flexDirection: 'column', 
                gap: { xs: 2, sm: 3 }
            }}
        >
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>1. Übertragene Quellen ({transferredChunks.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography variant="body2" sx={{mb: 2}}>
                        Diese Texte wurden aus der Heuristik übertragen und werden für die Analyse verwendet.
                        Um die Auswahl zu ändern, kehren Sie zur Heuristik zurück.
                    </Typography>
                    <List 
                        dense 
                        sx={{
                            maxHeight: { xs: 250, sm: 300 }, 
                            overflowY: 'auto', 
                            bgcolor: 'rgba(255, 255, 255, 0.02)', 
                            borderRadius: 2,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            p: 1
                        }}
                    >
                        {transferredChunks.map((chunk, index) => (
                            <ListItem 
                                key={chunk.id}
                                sx={{
                                    mb: 1,
                                    bgcolor: 'rgba(215, 84, 37, 0.1)',
                                    borderRadius: 1,
                                    border: '1px solid rgba(215, 84, 37, 0.3)',
                                    '&:last-child': { mb: 0 }
                                }}
                            >
                                <ListItemIcon>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {index + 1}
                                    </Box>
                                </ListItemIcon>
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography 
                                        variant="body2" 
                                        component="div"
                                        sx={{ 
                                            fontWeight: 500,
                                            color: 'primary.light',
                                            fontSize: { xs: '0.875rem', sm: '1rem' },
                                            mb: 0.5
                                        }}
                                    >
                                        {chunk.metadata.Artikeltitel || 'Unbekannter Titel'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary" component="div">
                                            📅 {chunk.metadata.Datum || 'N/A'}
                                        </Typography>
                                        <Typography 
                                            variant="caption" 
                                            component="div"
                                            sx={{ 
                                                color: chunk.relevance_score > 0.7 ? 'success.main' : 
                                                       chunk.relevance_score > 0.5 ? 'warning.main' : 'text.secondary',
                                                fontWeight: 500
                                            }}
                                        >
                                            🎯 Relevanz: {chunk.relevance_score.toFixed(3)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </AccordionDetails>
            </Accordion>
            
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>2. User-Prompt formulieren</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField name="user_prompt" label="Forschungsfrage" fullWidth multiline rows={3} value={params.user_prompt} onChange={handleParamChange} helperText="Formulieren Sie Ihre Forschungsfrage, die anhand der übertragenen Texte beantwortet werden soll."/>
                </AccordionDetails>
            </Accordion>
            
            <Accordion>
                 <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>3. LLM Auswählen</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                     <FormControl>
                        <RadioGroup row name="model_selection" value={params.model_selection} onChange={handleParamChange}>
                             <FormControlLabel value="hu-llm3" control={<Radio />} label="HU-LLM 3 (Berlin)" />
                             <FormControlLabel value="deepseek-reasoner" control={<Radio />} label="DeepSeek Reasoner" />
                             <FormControlLabel value="anthropic-claude" control={<Radio />} label="Anthropic Claude 3.5" />
                             <FormControlLabel value="openai-gpt4o" control={<Radio />} label="OpenAI GPT-4o" />
                             <FormControlLabel value="gemini-pro" control={<Radio />} label="Google Gemini 2.5 Pro" />
                        </RadioGroup>
                    </FormControl>
                    <Box>
                        <Typography gutterBottom variant="body2">Temperatur: <Typography component="span" color="primary.main" sx={{fontWeight: 'bold'}}>{params.temperature}</Typography></Typography>
                        <Slider name="temperature" value={params.temperature} onChange={(e,v) => handleSliderChange('temperature', v as number)} min={0.0} max={1.0} step={0.1} />
                    </Box>
                </AccordionDetails>
            </Accordion>

            <Accordion>
                 <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>4. System-Prompt</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField name="system_prompt_text" label="System-Prompt (Methodische Anleitung)" fullWidth multiline rows={8} value={params.system_prompt_text} onChange={handleParamChange} helperText="Steuert, wie das LLM die Analyse durchführt. Fokussieren Sie auf akademische Präzision und Quellentreue."/>
                </AccordionDetails>
            </Accordion>
            
            <Button 
                onClick={handleAnalyze} 
                variant="contained" 
                disabled={isAnalyzing} 
                startIcon={isAnalyzing ? <CircularProgress size={20}/> : <ScienceIcon/>} 
                sx={{
                    py: { xs: 2, sm: 1.5 },
                    fontSize: { xs: '1.1rem', sm: '1rem' },
                    fontWeight: 600,
                    background: isAnalyzing ? undefined : 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
                    boxShadow: isAnalyzing ? undefined : '0 4px 12px rgba(33, 150, 243, 0.3)',
                    '&:hover': {
                        background: isAnalyzing ? undefined : 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                        boxShadow: isAnalyzing ? undefined : '0 6px 16px rgba(33, 150, 243, 0.4)',
                        transform: isAnalyzing ? 'none' : 'translateY(-2px)',
                    },
                    '&:disabled': {
                        background: 'rgba(255, 255, 255, 0.12)',
                        color: 'rgba(255, 255, 255, 0.3)',
                    }
                }}
            >
                {isAnalyzing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>Analyse läuft</span>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {[0, 0.3, 0.6].map((delay, index) => (
                                <Box 
                                    key={index}
                                    sx={{ 
                                        width: 4, height: 4, borderRadius: '50%', 
                                        backgroundColor: 'currentColor',
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                        animationDelay: `${delay}s`,
                                        '@keyframes pulse': {
                                            '0%, 80%, 100%': { opacity: 0.3 },
                                            '40%': { opacity: 1 }
                                        }
                                    }} 
                                />
                            ))}
                        </Box>
                    </Box>
                ) : '🔬 Analyse starten'}
            </Button>
            
            {analysisError && <Alert severity="error" sx={{mt: 2}}>{analysisError}</Alert>}
            
            {analysisResult && <AnalysisResultsDisplay result={analysisResult} />}
        </Paper>
    );
};
