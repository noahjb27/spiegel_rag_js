// frontend/src/components/AnalysisPanel.tsx
// ==============================================================================
// Component for the "Analyse" tab, showing transferred chunks and analysis form.
// ==============================================================================
'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, CircularProgress, Accordion,
    AccordionSummary, AccordionDetails, TextField, Alert, List,
    ListItem, ListItemIcon, ListItemText, Divider, Collapse
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon, Science as ScienceIcon, Article as ArticleIcon
} from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';
import { AnalysisResult } from '@/types';

const AnalysisResults = ({ result }: { result: AnalysisResult }) => (
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

    const [params, setParams] = useState({
        user_prompt: 'Wie wurde die Berliner Mauer in den westdeutschen Medien dargestellt?',
        model_selection: 'hu-llm3',
        system_prompt_text: "Du bist ein erfahrener Historiker mit Expertise in der kritischen Auswertung von SPIEGEL-Artikeln...",
        temperature: 0.3
    });

    const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setParams(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleAnalyze = () => {
        performAnalysis(params);
    };

    // Automatically expand results when they arrive
    const [isResultOpen, setIsResultOpen] = useState(true);
    useEffect(() => {
        if(analysisResult) {
            setIsResultOpen(true);
        }
    }, [analysisResult]);


    if (transferredChunks.length === 0) {
        return <Alert severity="info" sx={{mt: 2}}>Übertragen Sie zuerst Texte aus der Heuristik-Phase, um die Analyse zu starten.</Alert>
    }

    return (
        <Paper elevation={3} sx={{p: 3, mt: 2, display: 'flex', flexDirection: 'column', gap: 3}}>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Übertragene Quellen ({transferredChunks.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <List dense sx={{maxHeight: 200, overflowY: 'auto'}}>
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
            
            <TextField name="user_prompt" label="Forschungsfrage" fullWidth multiline rows={3} value={params.user_prompt} onChange={handleParamChange}/>
            <TextField name="system_prompt_text" label="System-Prompt" fullWidth multiline rows={5} value={params.system_prompt_text} onChange={handleParamChange}/>
            
            <Button onClick={handleAnalyze} variant="contained" disabled={isAnalyzing} startIcon={isAnalyzing ? <CircularProgress size={20}/> : <ScienceIcon/>}>
                {isAnalyzing ? 'Analyse läuft...' : 'Analyse starten'}
            </Button>
            
            {analysisError && <Alert severity="error" sx={{mt: 2}}>{analysisError}</Alert>}
            
            {analysisResult && (
                 <Collapse in={isResultOpen}>
                    <AnalysisResults result={analysisResult} />
                 </Collapse>
            )}
        </Paper>
    );
};
