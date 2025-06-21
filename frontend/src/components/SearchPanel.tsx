// frontend/src/components/SearchPanel.tsx
// ==============================================================================
// The search panel component, responsible for all search inputs.
// ==============================================================================
'use client';

import React, { useState } from 'react';
import {
    Box, Paper, Typography, RadioGroup, FormControlLabel, Radio,
    TextField, Slider, Button, CircularProgress, Accordion,
    AccordionSummary, AccordionDetails, Checkbox
} from '@mui/material';
import { FindInPage as FindInPageIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';

export const SearchPanel = () => {
    const { performSearch, isSearching } = useAppStore();
    
    const [searchMode, setSearchMode] = useState<'standard' | 'llm-assisted'>('standard');
    const [formState, setFormState] = useState({
        retrieval_query: 'Berichterstattung über die Berliner Mauer',
        year_start: 1960, year_end: 1970, chunk_size: 3000,
        top_k: 10, chunks_per_interval: 5, use_time_intervals: false, keywords: 'mauer',
        search_in: ['Text'], use_semantic_expansion: true,
        llm_assisted_use_time_intervals: true, llm_assisted_time_interval_size: 5,
        chunks_per_interval_initial: 50, chunks_per_interval_final: 20,
        llm_assisted_min_retrieval_score: 0.25, llm_assisted_model: 'hu-llm3',
        llm_assisted_system_prompt_text: 'Evaluate the relevance of the text.'
    });

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;
        setFormState(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleSliderChange = (name: string, value: number | number[]) => {
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSearch = () => {
        performSearch(searchMode, formState);
    };

    return (
        <Paper elevation={3} sx={{p: 3}}>
            <Typography variant="h2" gutterBottom>Suchmethode wählen</Typography>
            <RadioGroup row value={searchMode} onChange={(e) => setSearchMode(e.target.value as 'standard' | 'llm-assisted')}>
                <FormControlLabel value="standard" control={<Radio />} label="Standard-Suche" />
                <FormControlLabel value="llm_assisted" control={<Radio />} label="LLM-Unterstützte Auswahl" />
            </RadioGroup>

            <TextField name="retrieval_query" label="Retrieval-Query" fullWidth multiline rows={2} value={formState.retrieval_query} onChange={handleFormChange} placeholder="Describe what to search for..." sx={{my: 2}}/>
            
            <Typography gutterBottom>Zeitraum: {formState.year_start} - {formState.year_end}</Typography>
            <Slider value={[formState.year_start, formState.year_end]} onChange={(e, val) => { handleSliderChange('year_start', (val as number[])[0]); handleSliderChange('year_end', (val as number[])[1]); }} valueLabelDisplay="auto" min={1948} max={1979} />

            {searchMode === 'standard' ? (
                 <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>Optionen für Standard-Suche</AccordionSummary>
                    <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                       <Typography gutterBottom>{formState.use_time_intervals ? 'Ergebnisse pro Zeit-Intervall' : 'Anzahl Ergebnisse (gesamt)'}</Typography>
                       <Slider value={formState.use_time_intervals ? formState.chunks_per_interval : formState.top_k} onChange={(e, val) => handleSliderChange(formState.use_time_intervals ? 'chunks_per_interval' : 'top_k', val as number)} valueLabelDisplay="auto" step={1} marks min={1} max={formState.use_time_intervals ? 20 : 50} />
                       <FormControlLabel control={<Checkbox name="use_time_intervals" checked={formState.use_time_intervals} onChange={handleFormChange} />} label="Zeit-Interval-Suche aktivieren" />
                    </AccordionDetails>
                 </Accordion>
            ) : (
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>Optionen für LLM-Unterstützte Auswahl</AccordionSummary>
                </Accordion>
            )}
            <Button variant="contained" onClick={handleSearch} disabled={isSearching} startIcon={isSearching ? <CircularProgress size={20} color="inherit"/> : <FindInPageIcon />} sx={{mt: 2, width: '100%'}}>
                {isSearching ? 'Suche läuft...' : 'Suche starten'}
            </Button>
        </Paper>
    );
};
