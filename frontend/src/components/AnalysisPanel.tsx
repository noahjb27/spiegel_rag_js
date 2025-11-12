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
    Slider, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon, Science as ScienceIcon,
    Link as LinkIcon, Download as DownloadIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '@/store/useAppStore';
import { AnalysisResult, Chunk } from '@/types';
import apiService from '@/lib/api';

// Citation component - displays clickable citations with chunk info
const CitationComponent = ({
    citationNumber,
    chunk,
    onClick
}: {
    citationNumber: number;
    chunk?: Chunk;
    onClick: () => void;
}) => {
    if (!chunk) {
        return <span>[{citationNumber}]</span>;
    }

    const title = chunk.metadata.Artikeltitel || 'Unbekannter Titel';
    const date = chunk.metadata.Datum || 'N/A';
    const tooltipText = `${title} (${date})`;

    return (
        <Tooltip title={tooltipText} arrow placement="top">
            <Chip
                label={citationNumber}
                size="small"
                onClick={onClick}
                icon={<LinkIcon style={{ fontSize: '0.875rem' }} />}
                sx={{
                    fontSize: '0.75rem',
                    height: '20px',
                    cursor: 'pointer',
                    mx: 0.3,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                        bgcolor: 'primary.dark',
                        transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s'
                }}
            />
        </Tooltip>
    );
};

// Modal to display referenced chunk details
const ChunkReferenceModal = ({
    chunk,
    citationNumber,
    open,
    onClose
}: {
    chunk?: Chunk;
    citationNumber: number;
    open: boolean;
    onClose: () => void;
}) => {
    if (!chunk) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
                Referenz [{citationNumber}]: {chunk.metadata.Artikeltitel || 'Unbekannter Titel'}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                        <strong>📅 Datum:</strong> {chunk.metadata.Datum || 'N/A'}
                    </Typography>
                    {chunk.metadata.Untertitel && (
                        <Typography variant="body2">
                            <strong>📝 Untertitel:</strong> {chunk.metadata.Untertitel}
                        </Typography>
                    )}
                    {chunk.metadata.Textsorte && (
                        <Typography variant="body2">
                            <strong>📋 Textsorte:</strong> {chunk.metadata.Textsorte}
                        </Typography>
                    )}
                    <Typography variant="body2">
                        <strong>🎯 Relevanz:</strong> {chunk.relevance_score.toFixed(3)}
                    </Typography>
                    {chunk.llm_evaluation_score && (
                        <Typography variant="body2">
                            <strong>🤖 LLM-Score:</strong> {chunk.llm_evaluation_score.toFixed(3)}
                        </Typography>
                    )}
                </Box>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        bgcolor: 'rgba(0, 0, 0, 0.05)',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        borderRadius: 2,
                        border: '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'Georgia, serif',
                            lineHeight: 1.6
                        }}
                    >
                        {chunk.content}
                    </Typography>
                </Paper>
            </DialogContent>
            <DialogActions>
                {chunk.metadata.URL && (
                    <Button
                        href={chunk.metadata.URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<LinkIcon />}
                    >
                        Original öffnen
                    </Button>
                )}
                <Button onClick={onClose} variant="contained">
                    Schließen
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Enhanced analysis results display with citations
const AnalysisResultsDisplay = ({ result, chunks }: { result: AnalysisResult; chunks: Chunk[] }) => {
    const [selectedChunk, setSelectedChunk] = useState<{ chunk: Chunk; citationNumber: number } | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadReasoningTrace = async () => {
        if (!result.metadata.reasoning_trace_filename) return;
        
        setIsDownloading(true);
        try {
            const response = await apiService.get(
                `/api/download/reasoning-trace/${result.metadata.reasoning_trace_filename}`,
                { responseType: 'blob' }
            );
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', result.metadata.reasoning_trace_filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download reasoning trace:', error);
            alert('Fehler beim Herunterladen der Reasoning-Ausgabe');
        } finally {
            setIsDownloading(false);
        }
    };

    // Custom text renderer to handle citations
    const components = {
        p: ({ children }: { children?: React.ReactNode }) => {
            // Process text to find citations
            const processText = (node: React.ReactNode): React.ReactNode => {
                if (typeof node === 'string') {
                    // Match [number] pattern
                    const parts: React.ReactNode[] = [];
                    let lastIndex = 0;
                    const citationRegex = /\[(\d+)\]/g;
                    let match;

                    while ((match = citationRegex.exec(node)) !== null) {
                        // Add text before citation
                        if (match.index > lastIndex) {
                            parts.push(node.substring(lastIndex, match.index));
                        }

                        // Add citation component
                        const citationNumber = parseInt(match[1]);
                        const chunk = chunks[citationNumber - 1]; // Arrays are 0-indexed
                        parts.push(
                            <CitationComponent
                                key={`citation-${match.index}-${citationNumber}`}
                                citationNumber={citationNumber}
                                chunk={chunk}
                                onClick={() => setSelectedChunk({ chunk, citationNumber })}
                            />
                        );

                        lastIndex = match.index + match[0].length;
                    }

                    // Add remaining text
                    if (lastIndex < node.length) {
                        parts.push(node.substring(lastIndex));
                    }

                    return parts.length > 0 ? parts : node;
                }

                return node;
            };

            return (
                <Typography
                    component="div"
                    sx={{ marginBottom: '1em' }}
                >
                    {React.Children.map(children, processText)}
                </Typography>
            );
        }
    };

    return (
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
                mb: 3,
                '& .markdown-content': {
                    fontFamily: 'Georgia, serif',
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    lineHeight: 1.7,
                    color: 'text.primary',
                    '& p': { marginBottom: '1em' },
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                        marginTop: '1.5em',
                        marginBottom: '0.5em',
                        fontWeight: 600
                    },
                    '& ul, & ol': {
                        marginLeft: '1.5em',
                        marginBottom: '1em'
                    },
                    '& li': { marginBottom: '0.5em' },
                    '& code': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        padding: '0.2em 0.4em',
                        borderRadius: '3px',
                        fontSize: '0.9em'
                    },
                    '& pre': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        padding: '1em',
                        borderRadius: '6px',
                        overflow: 'auto'
                    },
                    '& blockquote': {
                        borderLeft: '4px solid rgba(255, 255, 255, 0.3)',
                        paddingLeft: '1em',
                        marginLeft: 0,
                        fontStyle: 'italic',
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    '& a': {
                        color: 'primary.main',
                        textDecoration: 'underline',
                        '&:hover': { color: 'primary.light' }
                    }
                }
            }}
        >
            <Box className="markdown-content">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={components}
                >
                    {result.answer}
                </ReactMarkdown>
            </Box>
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
                    
                    {/* GPT-5 Reasoning Parameters */}
                    {(result.metadata.reasoning_effort || result.metadata.verbosity) && (
                        <>
                            {result.metadata.reasoning_effort && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 120 }}>🧠 Reasoning Effort:</Typography>
                                    <Chip 
                                        label={result.metadata.reasoning_effort} 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined"
                                    />
                                </Box>
                            )}
                            {result.metadata.verbosity && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 120 }}>📝 Verbosity:</Typography>
                                    <Chip 
                                        label={result.metadata.verbosity} 
                                        size="small" 
                                        color="secondary" 
                                        variant="outlined"
                                    />
                                </Box>
                            )}
                        </>
                    )}
                    
                    {/* Download Reasoning Trace Button */}
                    {result.metadata.reasoning_trace_filename && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={isDownloading ? <CircularProgress size={16} /> : <DownloadIcon />}
                                onClick={handleDownloadReasoningTrace}
                                disabled={isDownloading}
                                sx={{
                                    borderColor: 'primary.main',
                                    color: 'primary.light',
                                    '&:hover': {
                                        borderColor: 'primary.light',
                                        bgcolor: 'rgba(33, 150, 243, 0.1)'
                                    }
                                }}
                            >
                                {isDownloading ? 'Wird heruntergeladen...' : 'Reasoning-Schritte herunterladen'}
                            </Button>
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                💡 Laden Sie die vollständige Reasoning-Ausgabe herunter, um die Denkschritte des Modells nachzuvollziehen
                            </Typography>
                        </Box>
                    )}
                </Box>
            </AccordionDetails>
        </Accordion>

        {/* Citation Modal */}
        {selectedChunk && (
            <ChunkReferenceModal
                chunk={selectedChunk.chunk}
                citationNumber={selectedChunk.citationNumber}
                open={Boolean(selectedChunk)}
                onClose={() => setSelectedChunk(null)}
            />
        )}
    </Paper>
    );
};

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
        temperature: 0.3,
        reasoning_effort: 'medium',
        verbosity: 'medium'
    });

    const isGPT5Model = params.model_selection.startsWith('openai-gpt5');

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
                             <FormControlLabel value="openai-gpt4o" control={<Radio />} label="OpenAI GPT-4.1" />
                             <FormControlLabel value="openai-gpt5" control={<Radio />} label="🧠 GPT-4o Enhanced (Deep Reasoning)" />
                             <FormControlLabel value="openai-gpt5-mini" control={<Radio />} label="⚡ GPT-4o-mini (Balanced)" />
                             <FormControlLabel value="openai-gpt5-nano" control={<Radio />} label="🚀 GPT-4o-mini (Fast)" />
                             <FormControlLabel value="gemini-pro" control={<Radio />} label="Google Gemini 2.5 Pro" />
                        </RadioGroup>
                    </FormControl>
                    
                    {/* GPT-5 Specific Parameters */}
                    {isGPT5Model && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2, border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                            <Typography variant="subtitle2" color="primary.light" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                🧠 Enhanced Reasoning-Parameter (via Prompt Engineering)
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2, fontSize: '0.85rem' }}>
                                Diese Parameter werden durch Prompt-Anpassungen simuliert, da sie noch nicht direkt von der OpenAI API unterstützt werden.
                            </Alert>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControl>
                                    <Typography gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
                                        Reasoning Effort (Denktiefe):
                                    </Typography>
                                    <RadioGroup row name="reasoning_effort" value={params.reasoning_effort} onChange={handleParamChange}>
                                        <FormControlLabel value="minimal" control={<Radio size="small" />} label="Minimal (schnell)" />
                                        <FormControlLabel value="low" control={<Radio size="small" />} label="Niedrig" />
                                        <FormControlLabel value="medium" control={<Radio size="small" />} label="Mittel" />
                                        <FormControlLabel value="high" control={<Radio size="small" />} label="Hoch (tiefe Analyse)" />
                                    </RadioGroup>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Steuert, wie intensiv GPT-5 über die Antwort nachdenkt. Höhere Werte = bessere Qualität, aber langsamer.
                                    </Typography>
                                </FormControl>
                                
                                <FormControl>
                                    <Typography gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
                                        Verbosity (Antwortlänge):
                                    </Typography>
                                    <RadioGroup row name="verbosity" value={params.verbosity} onChange={handleParamChange}>
                                        <FormControlLabel value="low" control={<Radio size="small" />} label="Kurz (1-2 Sätze)" />
                                        <FormControlLabel value="medium" control={<Radio size="small" />} label="Mittel (Absätze)" />
                                        <FormControlLabel value="high" control={<Radio size="small" />} label="Ausführlich (detailliert)" />
                                    </RadioGroup>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Bestimmt die Ausführlichkeit der Antwort unabhängig vom Prompt.
                                    </Typography>
                                </FormControl>
                            </Box>
                        </Box>
                    )}
                    
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

            {analysisResult && <AnalysisResultsDisplay result={analysisResult} chunks={transferredChunks} />}
        </Paper>
    );
};
