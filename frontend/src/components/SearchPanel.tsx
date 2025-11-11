// frontend/src/components/SearchPanel.tsx
// ==============================================================================
// The search panel component, now with full feature parity, including
// detailed keyword previews and dynamic time interval calculations.
// ==============================================================================
'use client';

import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, RadioGroup, FormControlLabel, Radio,
    TextField, Slider, Button, CircularProgress, Accordion,
    AccordionSummary, AccordionDetails, Checkbox,
    MenuItem, Select, InputLabel, FormControl, Divider, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, SelectChangeEvent,
    useMediaQuery, useTheme
} from '@mui/material';
import type { SliderProps } from '@mui/material/Slider';
import { FindInPage as FindInPageIcon, ExpandMore as ExpandMoreIcon, AutoFixHigh as AutoFixHighIcon } from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';
import apiService from '@/lib/api';

// Type for the keyword preview data from our enhanced backend
type KeywordPreviewData = {
    [key: string]: {
        word: string;
        similarity: number;
        frequency: number;
    }[];
}

// Enhanced slider component with better mobile UX and accessibility
type LabeledSliderProps = Omit<SliderProps, 'onChange' | 'value'> & {
    name: string;
    label: string;
    value: number | number[];
    onChange: (event: Event, value: number | number[]) => void;
    hideValue?: boolean;
    unit?: string;
};

const LabeledSlider = ({ name, label, value, onChange, hideValue, unit = '', ...props }: LabeledSliderProps) => (
    <Box sx={{ my: 2, px: { xs: 0, sm: 1 } }}>
        <Typography gutterBottom variant="body2" component="label" htmlFor={name}>
            {label}{!hideValue && `: `}
            {!hideValue && (
                <Typography 
                    component="span" 
                    color="primary.main" 
                    sx={{ fontWeight: 'bold', fontSize: '1.1em' }}
                >
                    {Array.isArray(value) ? `${value[0]} - ${value[1]}` : value}{unit}
                </Typography>
            )}
        </Typography>
        <Slider 
            id={name}
            name={name} 
            value={value} 
            onChange={onChange} 
            valueLabelDisplay="auto" 
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
            {...props} 
        />
    </Box>
);

export const SearchPanel = () => {
    const { performSearch, isSearching, searchFormState, updateSearchFormState } = useAppStore();

    const [searchMode, setSearchMode] = useState<'standard' | 'llm-assisted'>('standard');
    const [keywordPreview, setKeywordPreview] = useState<{data: KeywordPreviewData | null, error: string | null}>({data: null, error: null});

    // Use the persisted form state from Zustand store
    const formState = searchFormState;

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        updateSearchFormState({ [name!]: value });
    };

    const handleSelectChange = (event: SelectChangeEvent<string | string[]>) => {
        const { name, value } = event.target;
        updateSearchFormState({ [name]: value });
    };

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
         const { name, checked } = event.target;
         updateSearchFormState({ [name]: checked });
    };

    const handleSliderChange = (name: string, value: number | number[]) => {
        updateSearchFormState({ [name]: value });
    };
    
    const handleSearch = () => {
        performSearch(searchMode, formState);
    };

    const handlePreviewKeywords = async () => {
        setKeywordPreview({data: null, error: null});
        try {
            const response = await apiService.get('/api/keywords/expand', {
                params: { expression: formState.keywords, factor: formState.semantic_expansion_factor }
            });
            setKeywordPreview({data: response.data, error: null});
        } catch {
            setKeywordPreview({data: null, error: "Fehler bei der Vorschau."})
        }
    };
    
    const timeIntervalCalculation = useMemo(() => {
        if (!formState.use_time_intervals) return null;
        const { year_start, year_end, time_interval_size } = formState;
        if (year_start > year_end) return "Startjahr muss vor Endjahr liegen.";

        const span = year_end - year_start + 1;
        const num_intervals = Math.ceil(span / time_interval_size);

        // Generate actual intervals
        const intervals: string[] = [];
        let currentStart = year_start;
        while (currentStart <= year_end) {
            const currentEnd = Math.min(currentStart + time_interval_size - 1, year_end);
            intervals.push(`${currentStart}-${currentEnd}`);
            currentStart = currentEnd + 1;
        }

        return {
            summary: `Der Zeitraum von ${span} Jahren wird in ${num_intervals} Intervalle à ca. ${time_interval_size} Jahre aufgeteilt.`,
            intervals: intervals
        };
    }, [formState]);

    const llmTimeIntervalCalculation = useMemo(() => {
        if (!formState.llm_assisted_use_time_intervals) return null;
        const { year_start, year_end, llm_assisted_time_interval_size } = formState;
        if (year_start > year_end) return "Startjahr muss vor Endjahr liegen.";

        const span = year_end - year_start + 1;
        const num_intervals = Math.ceil(span / llm_assisted_time_interval_size);

        // Generate actual intervals
        const intervals: string[] = [];
        let currentStart = year_start;
        while (currentStart <= year_end) {
            const currentEnd = Math.min(currentStart + llm_assisted_time_interval_size - 1, year_end);
            intervals.push(`${currentStart}-${currentEnd}`);
            currentStart = currentEnd + 1;
        }

        return {
            summary: `Der Zeitraum von ${span} Jahren wird in ${num_intervals} Intervalle à ca. ${llm_assisted_time_interval_size} Jahre aufgeteilt.`,
            intervals: intervals
        };
    }, [formState]);

    // Responsive rows for multiline text fields
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down('sm'));
    const retrievalRows = isXs ? 5 : 4;

    return (
        <Paper elevation={3} sx={{ 
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%)'
        }}>
            <Typography variant="h2" gutterBottom sx={{ mb: 3 }}>Suchmethode wählen</Typography>
            <RadioGroup 
                value={searchMode} 
                onChange={(e) => setSearchMode(e.target.value as 'standard' | 'llm-assisted')}
                sx={{ 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 2 },
                    mb: 2
                }}
            >
                <FormControlLabel 
                    value="standard" 
                    control={<Radio />} 
                    label="Standard-Suche (Schnell & Direkt)"
                    sx={{ 
                        '& .MuiFormControlLabel-label': { 
                            fontSize: { xs: '0.875rem', sm: '1rem' } 
                        } 
                    }}
                />
                <FormControlLabel 
                    value="llm-assisted" 
                    control={<Radio />} 
                    label="LLM-Unterstützte Auswahl (KI-gestützt & Gründlich)"
                    sx={{ 
                        '& .MuiFormControlLabel-label': { 
                            fontSize: { xs: '0.875rem', sm: '1rem' } 
                        } 
                    }}
                />
            </RadioGroup>

            <Divider sx={{ my: { xs: 2, sm: 3 } }} />

            <Typography variant="h3" gutterBottom sx={{ color: 'primary.light' }}>Allgemeine Einstellungen</Typography>
            <TextField 
                name="retrieval_query" 
                label="Retrieval-Query" 
                fullWidth 
                multiline 
                rows={retrievalRows}
                value={formState.retrieval_query} 
                onChange={handleFormChange} 
                placeholder="Beschreiben Sie, welche Art von Inhalten Sie im Archiv finden möchten..." 
                sx={{ my: 2 }} 
                helperText="Verwenden Sie wenige Stoppwörter und viele Begriffe."
                variant="outlined"
            />
            <FormControl fullWidth margin="normal">
                <InputLabel id="chunk-size-label">Chunking-Größe</InputLabel>
                <Select<number>
                    labelId="chunk-size-label"
                    name="chunk_size"
                    value={formState.chunk_size}
                    label="Chunking-Größe"
                    onChange={(e) => updateSearchFormState({ chunk_size: Number(e.target.value) })}
                >
                    <MenuItem value={500}>500 Zeichen (Präzision)</MenuItem>
                    <MenuItem value={2000}>2000 Zeichen (Balance)</MenuItem>
                    <MenuItem value={3000}>3000 Zeichen (Kontext)</MenuItem>
                </Select>
            </FormControl>
            <LabeledSlider 
                label="Zeitraum" 
                name="years" 
                value={[formState.year_start, formState.year_end]} 
                onChange={(_e: Event, val: number | number[]) => { 
                    handleSliderChange('year_start', (val as number[])[0]); 
                    handleSliderChange('year_end', (val as number[])[1]); 
                }} 
                min={1948} 
                max={1979}
                marks={[
                    { value: 1948, label: '1948' },
                    { value: 1960, label: '1960' },
                    { value: 1970, label: '1970' },
                    { value: 1979, label: '1979' }
                ]}
            />

            <Divider sx={{my:2}}/>
            
            {searchMode === 'standard' ? (
                <Box>
                    <Typography variant="h5" gutterBottom>Optionen für Standard-Suche</Typography>
                    <LabeledSlider label={formState.use_time_intervals ? 'Ergebnisse pro Zeit-Intervall' : 'Anzahl Ergebnisse (gesamt)'} name={formState.use_time_intervals ? 'chunks_per_interval' : 'top_k'} value={formState.use_time_intervals ? formState.chunks_per_interval : formState.top_k} onChange={(_e: Event, val: number | number[]) => handleSliderChange(formState.use_time_intervals ? 'chunks_per_interval' : 'top_k', val as number)} step={1} marks min={1} max={formState.use_time_intervals ? 20 : 50} />
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>Erweiterte Einstellungen</AccordionSummary>
                        <AccordionDetails>
                            <Accordion sx={{mb: 1}}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>Schlagwort-Filterung</AccordionSummary>
                                <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                    <TextField
                                        name="keywords"
                                        label="Schlagwörter (boolescher Ausdruck)"
                                        value={formState.keywords}
                                        onChange={handleFormChange}
                                        placeholder="z.B. mauer AND berlin"
                                        fullWidth
                                    />
                                    <FormControlLabel control={<Checkbox name="use_semantic_expansion" checked={formState.use_semantic_expansion} onChange={handleCheckboxChange} />} label="Semantische Erweiterung" />
                                    {formState.use_semantic_expansion && (
                                        <>
                                        <LabeledSlider label="Anzahl ähnlicher Wörter" name="semantic_expansion_factor" value={formState.semantic_expansion_factor} onChange={(_e: Event, val: number | number[]) => handleSliderChange('semantic_expansion_factor', val as number)} min={1} max={10} step={1} />
                                        <Button 
                                            onClick={handlePreviewKeywords} 
                                            startIcon={<AutoFixHighIcon/>} 
                                            size="small"
                                            variant="outlined"
                                            sx={{ mb: 1 }}
                                        >
                                            Vorschau ähnlicher Wörter
                                        </Button>
                                        {keywordPreview.data && (
                                             <TableContainer 
                                                component={Paper} 
                                                sx={{ 
                                                    mt: 1, 
                                                    maxHeight: { xs: 300, sm: 400 },
                                                    overflowX: 'auto'
                                                }}
                                            >
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Begriff</TableCell>
                                                            <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}>Ähnliches Wort</TableCell>
                                                            <TableCell align="right" sx={{ minWidth: { xs: 80, sm: 100 } }}>Ähnlichkeit</TableCell>
                                                            <TableCell align="right" sx={{ minWidth: { xs: 80, sm: 100 } }}>Häufigkeit</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {Object.entries(keywordPreview.data).map(([term, similarWords]) => 
                                                            similarWords.map((item, index) => (
                                                                <TableRow key={`${term}-${item.word}`}>
                                                                    {index === 0 && (
                                                                        <TableCell 
                                                                            rowSpan={similarWords.length} 
                                                                            sx={{ 
                                                                                verticalAlign: 'top',
                                                                                fontWeight: 'bold',
                                                                                backgroundColor: 'rgba(215, 84, 37, 0.1)'
                                                                            }}
                                                                        >
                                                                            {term}
                                                                        </TableCell>
                                                                    )}
                                                                    <TableCell>{item.word}</TableCell>
                                                                    <TableCell align="right">
                                                                        <Typography 
                                                                            component="span" 
                                                                            variant="body2"
                                                                            sx={{ 
                                                                                color: item.similarity > 0.7 ? 'success.main' : 
                                                                                       item.similarity > 0.5 ? 'warning.main' : 'text.secondary'
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
                                        )}
                                        {keywordPreview.error && <Alert severity="error" sx={{mt:1}}>{keywordPreview.error}</Alert>}
                                        </>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                             <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>Zeit-Interval-Suche</AccordionSummary>
                                <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                    <Typography variant="body2">Sorgt für eine gleichmäßige Verteilung der Ergebnisse über verschiedene Zeitperioden.</Typography>
                                    <FormControlLabel control={<Checkbox name="use_time_intervals" checked={formState.use_time_intervals} onChange={handleCheckboxChange} />} label="Zeit-Interval-Suche aktivieren" />
                                    {formState.use_time_intervals && (
                                        <>
                                            <LabeledSlider label="Intervall-Größe (Jahre)" name="time_interval_size" value={formState.time_interval_size} onChange={(_e: Event, v: number | number[])=>handleSliderChange('time_interval_size', v as number)} min={1} max={10} step={1} />
                                            {timeIntervalCalculation && typeof timeIntervalCalculation === 'object' && (
                                                <Alert severity="info" icon={false}>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        {timeIntervalCalculation.summary}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, color: 'info.dark' }}>
                                                        Intervalle:
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ textAlign: 'center', lineHeight: 1.6 }}>
                                                        {timeIntervalCalculation.intervals.join(' • ')}
                                                    </Typography>
                                                </Alert>
                                            )}
                                            {timeIntervalCalculation && typeof timeIntervalCalculation === 'string' && (
                                                <Alert severity="warning" icon={false}>{timeIntervalCalculation}</Alert>
                                            )}
                                        </>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            ) : (
                 <Box>
                    <Typography variant="h5" gutterBottom>Optionen für LLM-unterstützte Auswahl</Typography>
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>Retrieval-Einstellungen</AccordionSummary>
                        <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                            <TextField
                                name="llm_assisted_keywords"
                                label="Schlagwörter (boolescher Ausdruck)"
                                value={formState.llm_assisted_keywords}
                                onChange={handleFormChange}
                                placeholder="z.B. mauer AND berlin"
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel id="llm-assisted-search-in-label">In Feldern suchen</InputLabel>
                                <Select labelId="llm-assisted-search-in-label" multiple name="llm_assisted_search_in" value={formState.llm_assisted_search_in} label="In Feldern suchen" onChange={handleSelectChange}>
                                    <MenuItem value={'Text'}>Text</MenuItem>
                                    <MenuItem value={'Titel'}>Titel</MenuItem>
                                    <MenuItem value={'Zusammenfassung'}>Zusammenfassung</MenuItem>
                                </Select>
                            </FormControl>
                            <LabeledSlider label="Min. Retrieval-Relevanz" name="llm_assisted_min_retrieval_score" value={formState.llm_assisted_min_retrieval_score} onChange={(_e: Event, v: number | number[])=>handleSliderChange('llm_assisted_min_retrieval_score', v as number)} min={0} max={1} step={0.05} />
                            <FormControlLabel control={<Checkbox name="llm_assisted_use_time_intervals" checked={formState.llm_assisted_use_time_intervals} onChange={handleCheckboxChange} />} label="Zeit-Interval-Suche aktivieren" />
                            {formState.llm_assisted_use_time_intervals && (
                                <>
                                    <LabeledSlider label="Intervall-Größe (Jahre)" name="llm_assisted_time_interval_size" value={formState.llm_assisted_time_interval_size} onChange={(_e: Event, v: number | number[])=>handleSliderChange('llm_assisted_time_interval_size', v as number)} min={1} max={10} step={1} />
                                    {llmTimeIntervalCalculation && typeof llmTimeIntervalCalculation === 'object' && (
                                        <Alert severity="info" icon={false}>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                {llmTimeIntervalCalculation.summary}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, color: 'info.dark' }}>
                                                Intervalle:
                                            </Typography>
                                            <Typography variant="body2" sx={{ textAlign: 'center', lineHeight: 1.6 }}>
                                                {llmTimeIntervalCalculation.intervals.join(' • ')}
                                            </Typography>
                                        </Alert>
                                    )}
                                    {llmTimeIntervalCalculation && typeof llmTimeIntervalCalculation === 'string' && (
                                        <Alert severity="warning" icon={false}>{llmTimeIntervalCalculation}</Alert>
                                    )}
                                </>
                            )}
                            <LabeledSlider label="Initiale Chunks pro Fenster" name="chunks_per_interval_initial" value={formState.chunks_per_interval_initial} onChange={(_e: Event, v: number | number[])=>handleSliderChange('chunks_per_interval_initial', v as number)} min={10} max={200} step={10} />
                            <LabeledSlider label="Finale Chunks pro Fenster" name="chunks_per_interval_final" value={formState.chunks_per_interval_final} onChange={(_e: Event, v: number | number[])=>handleSliderChange('chunks_per_interval_final', v as number)} min={5} max={50} step={5} />
                        </AccordionDetails>
                    </Accordion>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>LLM-Einstellungen</AccordionSummary>
                        <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                            <FormControl fullWidth>
                                <InputLabel id="llm-assisted-model-label">Modell</InputLabel>
                                <Select labelId="llm-assisted-model-label" name="llm_assisted_model" value={formState.llm_assisted_model} label="Modell" onChange={handleSelectChange}>
                                    <MenuItem value={'hu-llm3'}>HU-LLM 3 (Berlin)</MenuItem>
                                    <MenuItem value={'deepseek-reasoner'}>DeepSeek Reasoner (API)</MenuItem>
                                    <MenuItem value={'anthropic-claude'}>Anthropic Claude 3.5 Sonnet</MenuItem>
                                    <MenuItem value={'openai-gpt4o'}>OpenAI GPT-4o</MenuItem>
                                    <MenuItem value={'gemini-pro'}>Google Gemini 2.5 Pro</MenuItem>
                                </Select>
                            </FormControl>
                            <LabeledSlider label="Temperatur" name="llm_assisted_temperature" value={formState.llm_assisted_temperature} onChange={(_e: Event, v: number | number[])=>handleSliderChange('llm_assisted_temperature', v as number)} min={0} max={1} step={0.05} />
                            <TextField
                                name="llm_assisted_system_prompt_text"
                                label="System-Prompt"
                                fullWidth
                                multiline
                                rows={6}
                                value={formState.llm_assisted_system_prompt_text}
                                onChange={handleFormChange}
                                placeholder="z.B. Du bewertest Textabschnitte aus SPIEGEL-Artikeln für historische Forschung..."
                            />
                        </AccordionDetails>
                    </Accordion>
                </Box>
            )}

            <Button 
                variant="contained" 
                onClick={handleSearch} 
                disabled={isSearching} 
                startIcon={isSearching ? <CircularProgress size={20} color="inherit"/> : <FindInPageIcon />} 
                sx={{
                    mt: 4, 
                    width: '100%', 
                    py: { xs: 2, sm: 1.5 },
                    fontSize: { xs: '1.1rem', sm: '1rem' },
                    fontWeight: 600,
                    background: isSearching ? undefined : 'linear-gradient(45deg, #d75425 30%, #e36842 90%)',
                    boxShadow: isSearching ? undefined : '0 4px 12px rgba(215, 84, 37, 0.3)',
                    '&:hover': {
                        background: isSearching ? undefined : 'linear-gradient(45deg, #b8421a 30%, #d75425 90%)',
                        boxShadow: isSearching ? undefined : '0 6px 16px rgba(215, 84, 37, 0.4)',
                        transform: isSearching ? 'none' : 'translateY(-2px)',
                    },
                    '&:disabled': {
                        background: 'rgba(255, 255, 255, 0.12)',
                        color: 'rgba(255, 255, 255, 0.3)',
                    }
                }}
            >
                {isSearching ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>Suche läuft</span>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Box sx={{ 
                                width: 4, height: 4, borderRadius: '50%', 
                                backgroundColor: 'currentColor',
                                animation: 'pulse 1.5s ease-in-out infinite',
                                animationDelay: '0s',
                                '@keyframes pulse': {
                                    '0%, 80%, 100%': { opacity: 0.3 },
                                    '40%': { opacity: 1 }
                                }
                            }} />
                            <Box sx={{ 
                                width: 4, height: 4, borderRadius: '50%', 
                                backgroundColor: 'currentColor',
                                animation: 'pulse 1.5s ease-in-out infinite',
                                animationDelay: '0.3s',
                            }} />
                            <Box sx={{ 
                                width: 4, height: 4, borderRadius: '50%', 
                                backgroundColor: 'currentColor',
                                animation: 'pulse 1.5s ease-in-out infinite',
                                animationDelay: '0.6s',
                            }} />
                        </Box>
                    </Box>
                ) : 'Suche starten'}
            </Button>
        </Paper>
    );
};
