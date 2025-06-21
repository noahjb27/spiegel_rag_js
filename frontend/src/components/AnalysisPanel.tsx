// frontend/src/components/AnalysisPanel.tsx
// ==============================================================================
// Component for the "Analyse" tab, with full feature parity to the original.
// ==============================================================================
'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, CircularProgress, Accordion,
    AccordionSummary, AccordionDetails, TextField, Alert, List,
    ListItem, ListItemIcon, ListItemText, Collapse, Select,
    MenuItem, InputLabel, FormControl, RadioGroup, Radio, FormControlLabel,
    Slider
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon, Science as ScienceIcon, Article as ArticleIcon
} from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';
import { AnalysisResult } from '@/types';

// A sub-component to cleanly display the final answer
const AnalysisResultsDisplay = ({ result }: { result: AnalysisResult }) => (
    <Paper elevation={5} sx={{p:3, mt: 4, borderColor: 'primary.main', borderTop: 4}}>
        <Typography variant="h2" gutterBottom>Analyse-Ergebnis</Typography>
        <Typography sx={{whiteSpace: 'pre-wrap', fontFamily: 'monospace', bgcolor: 'background.default', p: 2, borderRadius: 1}}>
            {result.answer}
        </Typography>
        <Accordion sx={{mt: 2}}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>Metadaten</AccordionSummary>
            <AccordionDetails>
                <Typography variant="body2">Modell: {result.metadata.model_used}</Typography>
                <Typography variant="body2">Analysezeit: {result.metadata.analysis_time.toFixed(2)} Sekunden</Typography>
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
        <Paper elevation={3} sx={{p: 3, mt: 2, display: 'flex', flexDirection: 'column', gap: 3}}>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>1. Übertragene Quellen ({transferredChunks.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography variant="body2" sx={{mb: 2}}>
                        Diese Texte wurden aus der Heuristik übertragen und werden für die Analyse verwendet.
                        Um die Auswahl zu ändern, kehren Sie zur Heuristik zurück.
                    </Typography>
                    <List dense sx={{maxHeight: 200, overflowY: 'auto', bgcolor: 'background.default', borderRadius: 1}}>
                        {transferredChunks.map(chunk => (
                            <ListItem key={chunk.id}>
                                <ListItemIcon><ArticleIcon fontSize="small"/></ListItemIcon>
                                <ListItemText 
                                    primary={chunk.metadata.Artikeltitel} 
                                    secondary={`Datum: ${chunk.metadata.Datum} | Relevanz: ${chunk.relevance_score.toFixed(3)}`}
                                />
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
                             <FormControlLabel value="openai-gpt4o" control={<Radio />} label="OpenAI GPT-4o" />
                             <FormControlLabel value="gemini-pro" control={<Radio />} label="Google Gemini" />
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
            
            <Button onClick={handleAnalyze} variant="contained" disabled={isAnalyzing} startIcon={isAnalyzing ? <CircularProgress size={20}/> : <ScienceIcon/>} sx={{py: 1.5}}>
                {isAnalyzing ? 'Analyse läuft...' : 'Analyse starten'}
            </Button>
            
            {analysisError && <Alert severity="error" sx={{mt: 2}}>{analysisError}</Alert>}
            
            {analysisResult && <AnalysisResultsDisplay result={analysisResult} />}
        </Paper>
    );
};
