// frontend/src/components/SearchPanel.tsx
// ==============================================================================
// The search panel component, with full feature parity and the corrected
// onChange handler for the Select component.
// ==============================================================================
'use client';

import React, { useState } from 'react';
import {
    Box, Paper, Typography, RadioGroup, FormControlLabel, Radio,
    TextField, Slider, Button, CircularProgress, Accordion,
    AccordionSummary, AccordionDetails, Checkbox, FormGroup,
    MenuItem, Select, InputLabel, FormControl, Divider, Alert, SelectChangeEvent,
    Chip, Grid
} from '@mui/material';
import { FindInPage as FindInPageIcon, ExpandMore as ExpandMoreIcon, AutoFixHigh } from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';
import apiService from '@/lib/api';
import { KeywordExpansion, SimilarWord } from '@/types';

// Helper component for styled sliders
const LabeledSlider = ({ name, label, value, onChange, hideValue = false, ...props }: any) => (
    <Box sx={{my: 1}}>
        <Typography gutterBottom variant="body2">
            {label}
            {!hideValue && (
                <>
                    : <Typography component="span" color="primary.main" sx={{fontWeight: 'bold'}}>
                        {Array.isArray(value) ? `${value[0]} - ${value[1]}` : value}
                    </Typography>
                </>
            )}
        </Typography>
        <Slider name={name} value={value} onChange={onChange} valueLabelDisplay="auto" {...props} />
    </Box>
);

export const SearchPanel = () => {
    const { performSearch, isSearching } = useAppStore();
    
    const [searchMode, setSearchMode] = useState<'standard' | 'llm-assisted'>('standard');
    const [keywordPreview, setKeywordPreview] = useState<{data: KeywordExpansion | null, error: string | null}>({data: null, error: null});

    const [formState, setFormState] = useState({
        retrieval_query: 'Berichterstattung über die Berliner Mauer',
        year_start: 1960,
        year_end: 1970,
        chunk_size: 3000,
        top_k: 10,
        chunks_per_interval: 5,
        use_time_intervals: false,
        time_interval_size: 5,
        keywords: '',
        search_in: ['Text'],
        use_semantic_expansion: true,
        semantic_expansion_factor: 3,
        llm_assisted_use_time_intervals: true,
        llm_assisted_time_interval_size: 5,
        chunks_per_interval_initial: 50,
        chunks_per_interval_final: 20,
        llm_assisted_min_retrieval_score: 0.25,
        llm_assisted_keywords: '',
        llm_assisted_search_in: ['Text'],
        llm_assisted_model: 'hu-llm3',
        llm_assisted_temperature: 0.2,
        llm_assisted_system_prompt_text: 'Du bewertest Textabschnitte aus SPIEGEL-Artikeln...'
    });
    const keywordPlaceholder = 'z.B. mauer AND berlin';

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormState(prev => ({ ...prev, [name!]: value }));
    };
    
    // --- THIS IS THE FIX ---
    // A dedicated handler for MUI Select components, using the correct event type.
    const handleSelectChange = (event: SelectChangeEvent<any>) => {
        const { name, value } = event.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
         const { name, checked } = event.target;
         setFormState(prev => ({ ...prev, [name]: checked }));
    };
    
    const handleSliderChange = (name: string, value: number | number[]) => {
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSearch = () => {
        performSearch(searchMode, formState);
    };

    const handlePreviewKeywords = async () => {
        setKeywordPreview({data: null, error: null});
        try {
            const response = await apiService.get('/api/keywords/expand', {
                params: {
                    expression: formState.keywords,
                    factor: formState.semantic_expansion_factor
                }
            });
            setKeywordPreview({data: response.data, error: null});
        } catch (err: any) {
            setKeywordPreview({data: null, error: err.response?.data?.error || "Fehler bei der Vorschau."})
        }
    };
    
    return (
        <Paper elevation={3} sx={{p: 3}}>
            <Typography variant="h2" gutterBottom>Suchmethode wählen</Typography>
            <RadioGroup row value={searchMode} onChange={(e) => setSearchMode(e.target.value as 'standard' | 'llm-assisted')}>
                <FormControlLabel value="standard" control={<Radio />} label="Standard-Suche" />
                <FormControlLabel value="llm_assisted" control={<Radio />} label="LLM-Unterstützte Auswahl" />
            </RadioGroup>

            <Divider sx={{my:2}}/>

            <Typography variant="h5" gutterBottom>Allgemeine Einstellungen</Typography>
            <TextField name="retrieval_query" label="Retrieval-Query" fullWidth multiline rows={2} value={formState.retrieval_query} onChange={handleFormChange} placeholder="Beschreiben Sie, welche Art von Inhalten Sie im Archiv finden möchten..." sx={{my: 2}} helperText="Verwende wenige Stoppwörter und viele Begriffe um Retrieval zu optimieren."/>
            <FormControl fullWidth margin="normal">
                <InputLabel id="chunk-size-label">Chunking-Größe</InputLabel>
                <Select labelId="chunk-size-label" name="chunk_size" value={formState.chunk_size} label="Chunking-Größe" onChange={handleSelectChange}>
                    <MenuItem value={500}>500 Zeichen (Präzision)</MenuItem>
                    <MenuItem value={2000}>2000 Zeichen (Balance)</MenuItem>
                    <MenuItem value={3000}>3000 Zeichen (Kontext)</MenuItem>
                </Select>
            </FormControl>
            <LabeledSlider label={`Zeitraum (${formState.year_start} bis ${formState.year_end})`} name="years" value={[formState.year_start, formState.year_end]} onChange={(e: any, val: number | number[]) => { handleSliderChange('year_start', (val as number[])[0]); handleSliderChange('year_end', (val as number[])[1]); }} hideValue={true} min={1948} max={1979} />

            <Divider sx={{my:2}}/>
            
            {searchMode === 'standard' ? (
                <Box>
                    <Typography variant="h5" gutterBottom>Optionen für Standard-Suche</Typography>
                    <LabeledSlider label={formState.use_time_intervals ? 'Chunks pro Zeit-Intervall' : 'Anzahl Chunk Anzahl (gesamt)'} name={formState.use_time_intervals ? 'chunks_per_interval' : 'top_k'} value={formState.use_time_intervals ? formState.chunks_per_interval : formState.top_k} onChange={(e: any, val: number | number[]) => handleSliderChange(formState.use_time_intervals ? 'chunks_per_interval' : 'top_k', val as number)} step={1} marks min={1} max={formState.use_time_intervals ? 20 : 50} />
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>Erweiterte Einstellungen</AccordionSummary>
                        <AccordionDetails>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>Schlagwort-Filterung</AccordionSummary>
                                <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                    <TextField name="keywords" label="Schlagwörter (boolescher Ausdruck)" value={formState.keywords} onChange={handleFormChange} fullWidth />
                                    <FormControlLabel control={<Checkbox name="use_semantic_expansion" checked={formState.use_semantic_expansion} onChange={handleCheckboxChange} />} label="Semantische Erweiterung" />
                                    {formState.use_semantic_expansion && (
                                        <>
                                        <LabeledSlider label="Anzahl ähnlicher Wörter" name="semantic_expansion_factor" value={formState.semantic_expansion_factor} onChange={(e: any, val: number | number[]) => handleSliderChange('semantic_expansion_factor', val as number)} min={1} max={10} step={1} />
                                        <Button onClick={handlePreviewKeywords} startIcon={<AutoFixHigh/>} size="small">Vorschau ähnlicher Wörter</Button>
                                        {keywordPreview.data && <Alert severity="success" sx={{mt:1}}><pre>{JSON.stringify(keywordPreview.data, null, 2)}</pre></Alert>}
                                        {keywordPreview.error && <Alert severity="error" sx={{mt:1}}>{keywordPreview.error}</Alert>}
                                        </>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                             <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>Zeit-Interval-Suche</AccordionSummary>
                                <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                     <FormControlLabel control={<Checkbox name="use_time_intervals" checked={formState.use_time_intervals} onChange={handleCheckboxChange} />} label="Zeit-Interval-Suche aktivieren" />
                                     {formState.use_time_intervals && <LabeledSlider label="Intervall-Größe (Jahre)" name="time_interval_size" value={formState.time_interval_size} onChange={(e:any, v:number|number[])=>handleSliderChange('time_interval_size',v as number)} min={1} max={10} step={1} />}
                                </AccordionDetails>
                            </Accordion>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            ) : (
                <Box>
                    <Typography variant="h5" gutterBottom>Optionen für LLM-Unterstützte Auswahl</Typography>
                    <LabeledSlider label="Initial pro Intervall" name="chunks_per_interval_initial" value={formState.chunks_per_interval_initial} onChange={(e:any,v:number|number[])=>handleSliderChange('chunks_per_interval_initial', v as number)} min={10} max={200} step={5} />
                    <LabeledSlider label="Final pro Intervall" name="chunks_per_interval_final" value={formState.chunks_per_interval_final} onChange={(e:any,v:number|number[])=>handleSliderChange('chunks_per_interval_final', v as number)} min={5} max={100} step={5} />
                    <LabeledSlider label="Mindest-Retrieval-Score" name="llm_assisted_min_retrieval_score" value={formState.llm_assisted_min_retrieval_score} onChange={(e:any,v:number|number[])=>handleSliderChange('llm_assisted_min_retrieval_score', v as number)} min={0.1} max={0.8} step={0.05} />
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>KI-Bewertungseinstellungen</AccordionSummary>
                        <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                             <LabeledSlider label="Temperatur" name="llm_assisted_temperature" value={formState.llm_assisted_temperature} onChange={(e:any,v:number|number[])=>handleSliderChange('llm_assisted_temperature', v as number)} min={0.1} max={1.0} step={0.1} />
                            <TextField name="llm_assisted_system_prompt_text" label="System Prompt für Bewertung" multiline rows={4} value={formState.llm_assisted_system_prompt_text} onChange={handleFormChange} fullWidth />
                        </AccordionDetails>
                    </Accordion>
                </Box>
            )}

            <Button variant="contained" onClick={handleSearch} disabled={isSearching} startIcon={isSearching ? <CircularProgress size={20} color="inherit"/> : <FindInPageIcon />} sx={{mt: 3, width: '100%', py: 1.5}}>
                {isSearching ? 'Suche läuft...' : 'Suche starten'}
            </Button>
        </Paper>
    );
};
