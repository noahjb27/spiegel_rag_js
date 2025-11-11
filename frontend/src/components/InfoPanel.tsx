// frontend/src/components/InfoPanel.tsx
// ==============================================================================
// A simple component to display information about the application.
// ==============================================================================
'use client';

import React from 'react';
import { Paper, Typography, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';

export const InfoPanel = () => {
    return (
        <Paper elevation={3} sx={{p: 3, mt: 2}}>
            <Typography variant="h2" gutterBottom>Über das SPIEGEL RAG-System</Typography>
            <Typography paragraph>
                Dieses System ermöglicht die professionelle Durchsuchung und Analyse von Der Spiegel-Artikeln aus den Jahren 1948 bis 1979 
                mithilfe von Retrieval-Augmented Generation (RAG). Es bietet Forschern einen strukturierten zweistufigen Workflow 
                für die systematische Quellenauswahl und -analyse.
            </Typography>
            <Divider sx={{my: 2}} />
            
            <Typography variant="h5" gutterBottom>Zweistufiger Forschungsworkflow</Typography>
            <List>
                <ListItem>
                    <ListItemIcon><CheckCircleOutline color="primary"/></ListItemIcon>
                    <ListItemText 
                        primary="Phase 1: Heuristik (Quellenauswahl)" 
                        secondary="Semantische Suche mit Keyword-Filterung oder LLM-unterstützte Auswahl mit KI-basierter Relevanzbewertung. Unterstützt Zeitraumfilterung und semantische Begriffserweiterung."
                    />
                </ListItem>
                 <ListItem>
                    <ListItemIcon><CheckCircleOutline color="primary"/></ListItemIcon>
                    <ListItemText 
                        primary="Phase 2: Analyse (Quellenverarbeitung)" 
                        secondary="Quellenbasierte Analyse mit 6 verfügbaren Sprachmodellen (HU Berlin LLMs, OpenAI GPT-4o, Google Gemini 2.5 Pro, DeepSeek Reasoner, Anthropic Claude). Generiert wissenschaftlich fundierte Antworten ausschließlich basierend auf den ausgewählten Texten."
                    />
                </ListItem>
            </List>

            <Divider sx={{my: 2}} />
            <Typography variant="h5" gutterBottom>Technische Infrastruktur</Typography>
            <Typography paragraph>
                <strong>Frontend:</strong> React/Next.js mit TypeScript und Material-UI für eine moderne, responsive Benutzeroberfläche.
            </Typography>
            <Typography paragraph>
                <strong>Backend:</strong> Python/Flask API mit modularer Architektur. Nutzt ChromaDB für Vektorspeicherung, 
                Ollama für Text-Embeddings und FastText-Modelle für semantische Begriffserweiterung.
            </Typography>
            <Typography paragraph>
                <strong>LLM-Integration:</strong> Unterstützt sowohl lokale HU Berlin Compute-Cluster als auch externe APIs 
                (OpenAI, Google, DeepSeek, Anthropic) für flexible Analysemöglichkeiten.
            </Typography>
            <Typography paragraph>
                <strong>Skalierung:</strong> Optimiert für bis zu 15+ gleichzeitige Nutzer mit robusten Fehlerbehandlungs-
                und Monitoring-Mechanismen.
            </Typography>

            <Divider sx={{my: 2}} />
            <Typography variant="h5" gutterBottom>Wichtige Begriffe</Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontSize: '1rem', fontWeight: 600 }}>
                Retrieval-Relevanz
            </Typography>
            <Typography paragraph sx={{ fontSize: '0.95rem' }}>
                Die <strong>Retrieval-Relevanz</strong> wird durch die Ähnlichkeit zwischen Ihrer Suchanfrage und den Textabschnitten berechnet.
                Grundlage ist die Cosine-Distanz zwischen semantischen Embeddings (Vektordarstellungen) der Texte.
                Höhere Werte (näher an 1.0) bedeuten größere semantische Ähnlichkeit.
            </Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontSize: '1rem', fontWeight: 600 }}>
                LLM-Score / KI-Bewertung
            </Typography>
            <Typography paragraph sx={{ fontSize: '0.95rem' }}>
                Bei der <strong>LLM-unterstützten Auswahl</strong> bewertet ein Sprachmodell jeden Textabschnitt zusätzlich auf seine
                inhaltliche Relevanz für Ihre Forschungsfrage. Der <strong>LLM-Score</strong> (0-10) zeigt diese Bewertung numerisch,
                während die <strong>KI-Bewertung</strong> eine kurze textuelle Begründung des Modells liefert.
                Dies hilft, besonders relevante Quellen zu identifizieren.
            </Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontSize: '1rem', fontWeight: 600 }}>
                Embeddings & Cosine-Distanz
            </Typography>
            <Typography paragraph sx={{ fontSize: '0.95rem' }}>
                <strong>Embeddings</strong> sind hochdimensionale Vektordarstellungen von Texten, die deren semantische Bedeutung erfassen.
                Die <strong>Cosine-Distanz</strong> misst den Winkel zwischen zwei solchen Vektoren – je kleiner der Winkel, desto ähnlicher
                die Bedeutung. Diese Technik ermöglicht es, inhaltlich verwandte Texte zu finden, selbst wenn sie unterschiedliche Wörter verwenden.
            </Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontSize: '1rem', fontWeight: 600 }}>
                Chunks
            </Typography>
            <Typography paragraph sx={{ fontSize: '0.95rem' }}>
                Artikel werden in <strong>Chunks</strong> (Textabschnitte) mit konfigurierbarer Größe (500, 2000 oder 3000 Zeichen) aufgeteilt.
                Diese Granularität ermöglicht präzisere Suchen und fokussierte Analysen einzelner Textpassagen statt ganzer Artikel.
            </Typography>
        </Paper>
    );
};
