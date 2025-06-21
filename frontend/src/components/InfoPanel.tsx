// frontend/src/components/InfoPanel.tsx
// ==============================================================================
// A simple component to display information about the application.
// ==============================================================================
'use client';

import React from 'react';
import { Box, Paper, Typography, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';

export const InfoPanel = () => {
    return (
        <Paper elevation={3} sx={{p: 3, mt: 2}}>
            <Typography variant="h2" gutterBottom>Über das SPIEGEL RAG-System</Typography>
            <Typography paragraph>
                Dieses System ermöglicht die Durchsuchung und Analyse von Der Spiegel-Artikeln aus den Jahren 1948 bis 1979 
                mithilfe von Retrieval-Augmented Generation (RAG). Es ist als professionelles Forschungswerkzeug konzipiert,
                das einen zweistufigen Workflow bietet.
            </Typography>
            <Divider sx={{my: 2}} />
            
            <Typography variant="h5" gutterBottom>Zwei-Phasen-Ansatz</Typography>
            <List>
                <ListItem>
                    <ListItemIcon><CheckCircleOutline color="primary"/></ListItemIcon>
                    <ListItemText 
                        primary="Phase 1: Heuristik (Quellenauswahl)" 
                        secondary="Finden Sie relevante Textquellen mithilfe der semantischen Standard-Suche oder der erweiterten LLM-unterstützten Auswahl, die eine KI-basierte Bewertung der Quellen vornimmt."
                    />
                </ListItem>
                 <ListItem>
                    <ListItemIcon><CheckCircleOutline color="primary"/></ListItemIcon>
                    <ListItemText 
                        primary="Phase 2: Analyse (Quellenverarbeitung)" 
                        secondary="Übertragen Sie Ihre ausgewählten Quellen, formulieren Sie eine präzise Forschungsfrage und erhalten Sie eine vom Sprachmodell generierte, quellenbasierte Antwort, die sich ausschließlich auf die bereitgestellten Texte stützt."
                    />
                </ListItem>
            </List>

            <Divider sx={{my: 2}} />
            <Typography variant="h5" gutterBottom>Technische Details</Typography>
             <Typography paragraph>
                Die Anwendung verwendet ein React/Next.js-Frontend für eine moderne und reaktionsschnelle Benutzeroberfläche und ein robustes Python/Flask-Backend, das die Kernlogik über eine API bereitstellt. 
                Die semantische Suche wird durch ChromaDB und Ollama Embedding-Modelle realisiert.
            </Typography>
        </Paper>
    );
};
