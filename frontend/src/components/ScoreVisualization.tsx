// frontend/src/components/ScoreVisualization.tsx
// ==============================================================================
// Component to visualize score distributions (Relevanz and LLM-Scores)
// ==============================================================================
'use client';

import React, { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { ShowChart as ShowChartIcon } from '@mui/icons-material';
import { Chunk } from '@/types';

interface ScoreVisualizationProps {
    chunks: Chunk[];
}

// Helper to calculate distribution statistics
const calculateStats = (scores: number[]) => {
    if (scores.length === 0) return null;

    const sorted = [...scores].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Calculate quartiles
    const q1Index = Math.floor(sorted.length * 0.25);
    const medianIndex = Math.floor(sorted.length * 0.5);
    const q3Index = Math.floor(sorted.length * 0.75);

    const q1 = sorted[q1Index];
    const median = sorted[medianIndex];
    const q3 = sorted[q3Index];

    return { min, max, mean, q1, median, q3 };
};

// Violin plot component for a single score type
const ViolinPlot = ({
    scores,
    label,
    color
}: {
    scores: number[];
    label: string;
    color: string;
}) => {
    const stats = useMemo(() => calculateStats(scores), [scores]);

    if (!stats) return null;

    // Calculate dynamic Y-axis range with padding
    const scoreRange = stats.max - stats.min;
    const padding = Math.max(0.05, scoreRange * 0.2); // At least 5% padding, or 20% of range
    const yMin = Math.max(0, stats.min - padding);
    const yMax = Math.min(1, stats.max + padding);
    const yRange = yMax - yMin;

    // Helper to map score to Y position
    const scoreToY = (score: number) => ((yMax - score) / yRange) * 200;

    // Create density distribution (simplified violin shape)
    const bins = 10;
    const binCounts = new Array(bins).fill(0);

    scores.forEach(score => {
        // Map score to bin based on the dynamic range
        const normalizedScore = (score - yMin) / yRange;
        const binIndex = Math.min(Math.floor(normalizedScore * bins), bins - 1);
        if (binIndex >= 0 && binIndex < bins) {
            binCounts[binIndex]++;
        }
    });

    const maxBinCount = Math.max(...binCounts);
    const maxWidth = 40; // Maximum width of violin in pixels

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Label */}
            <Typography
                variant="subtitle2"
                sx={{
                    mb: 1,
                    fontWeight: 600,
                    color: 'text.primary'
                }}
            >
                {label}
            </Typography>

            {/* Violin plot container */}
            <Box sx={{
                position: 'relative',
                height: 200,
                width: 80,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}>
                {/* Y-axis scale */}
                <Box sx={{
                    position: 'absolute',
                    left: -30,
                    top: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    color: 'text.secondary'
                }}>
                    <span>{yMax.toFixed(2)}</span>
                    <span>{((yMax + yMin) / 2).toFixed(2)}</span>
                    <span>{yMin.toFixed(2)}</span>
                </Box>

                {/* Violin shape */}
                <svg width="80" height="200" style={{ overflow: 'visible' }}>
                    {/* Draw violin shape from density distribution */}
                    {binCounts.map((count, i) => {
                        const binTop = yMin + ((bins - i) / bins) * yRange;
                        const binBottom = yMin + ((bins - i - 1) / bins) * yRange;
                        const y = scoreToY(binTop);
                        const height = scoreToY(binBottom) - y;
                        const width = (count / maxBinCount) * maxWidth;
                        const x = 40 - width / 2;

                        return (
                            <rect
                                key={i}
                                x={x}
                                y={y}
                                width={width}
                                height={height}
                                fill={color}
                                opacity={0.6}
                            />
                        );
                    })}

                    {/* Box plot overlay */}
                    {/* Min-Max line */}
                    <line
                        x1={40}
                        y1={scoreToY(stats.min)}
                        x2={40}
                        y2={scoreToY(stats.max)}
                        stroke={color}
                        strokeWidth={2}
                    />

                    {/* Q1-Q3 box */}
                    <rect
                        x={30}
                        y={scoreToY(stats.q3)}
                        width={20}
                        height={scoreToY(stats.q1) - scoreToY(stats.q3)}
                        fill="white"
                        stroke={color}
                        strokeWidth={2}
                        opacity={0.9}
                    />

                    {/* Median line */}
                    <line
                        x1={25}
                        y1={scoreToY(stats.median)}
                        x2={55}
                        y2={scoreToY(stats.median)}
                        stroke={color}
                        strokeWidth={3}
                    />

                    {/* Mean marker (circle) */}
                    <circle
                        cx={40}
                        cy={scoreToY(stats.mean)}
                        r={3}
                        fill={color}
                        stroke="white"
                        strokeWidth={1}
                    />
                </svg>
            </Box>

            {/* Statistics */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    <strong>Median:</strong> {stats.median.toFixed(3)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    <strong>Mean:</strong> {stats.mean.toFixed(3)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    <strong>Range:</strong> {stats.min.toFixed(3)} - {stats.max.toFixed(3)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    <strong>N:</strong> {scores.length}
                </Typography>
            </Box>
        </Box>
    );
};

export const ScoreVisualization: React.FC<ScoreVisualizationProps> = ({ chunks }) => {
    const { relevanceScores, llmScores } = useMemo(() => {
        const relevanceScores = chunks.map(c => c.relevance_score);
        const llmScores = chunks
            .filter(c => c.llm_evaluation_score !== undefined)
            .map(c => c.llm_evaluation_score!);

        return { relevanceScores, llmScores };
    }, [chunks]);

    const hasLLMScores = llmScores.length > 0;

    return (
        <Paper sx={{
            p: 2,
            mb: 2,
            background: 'linear-gradient(135deg, rgba(215, 84, 37, 0.05) 0%, rgba(178, 176, 105, 0.05) 100%)',
            border: '1px solid rgba(215, 84, 37, 0.2)'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShowChartIcon color="primary" />
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    Score-Verteilung
                </Typography>
            </Box>

            <Box sx={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'flex-start',
                gap: 2,
                flexWrap: 'wrap'
            }}>
                <ViolinPlot
                    scores={relevanceScores}
                    label="🎯 Relevanz-Scores"
                    color="#1976d2"
                />

                {hasLLMScores && (
                    <ViolinPlot
                        scores={llmScores}
                        label="🤖 LLM-Scores"
                        color="#9c27b0"
                    />
                )}
            </Box>

            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 2, textAlign: 'center', fontStyle: 'italic' }}
            >
                Violin-Plot mit Box-Plot-Overlay: zeigt Verteilung (Form), Median (dicke Linie),
                Mean (Punkt), Quartile (Box) und Range (Linie)
            </Typography>
        </Paper>
    );
};
