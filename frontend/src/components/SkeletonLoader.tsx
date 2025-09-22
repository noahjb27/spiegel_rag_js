// frontend/src/components/SkeletonLoader.tsx
// ==============================================================================
// Reusable skeleton loading components for improved perceived performance
// ==============================================================================
'use client';

import React from 'react';
import { Box, Paper, Skeleton, Typography } from '@mui/material';

// Search results skeleton
export const SearchResultsSkeleton = ({ count = 5 }: { count?: number }) => (
    <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Skeleton variant="rectangular" width={40} height={24} />
                <Skeleton variant="text" width="30%" height={24} />
                <Skeleton variant="rectangular" width={80} height={24} />
            </Box>
        </Paper>
        
        {Array.from({ length: count }).map((_, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Skeleton variant="rectangular" width={24} height={24} />
                    <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="80%" height={28} />
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Skeleton variant="text" width="25%" height={20} />
                            <Skeleton variant="text" width="30%" height={20} />
                        </Box>
                    </Box>
                    <Skeleton variant="rectangular" width={60} height={32} />
                </Box>
            </Paper>
        ))}
    </Box>
);

// Analysis skeleton
export const AnalysisSkeleton = () => (
    <Box sx={{ mt: 4 }}>
        <Paper elevation={8} sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="text" width="40%" height={40} />
            </Box>
            
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Skeleton variant="text" width="100%" height={24} />
                <Skeleton variant="text" width="95%" height={24} />
                <Skeleton variant="text" width="87%" height={24} />
                <Skeleton variant="text" width="92%" height={24} />
                <Skeleton variant="text" width="78%" height={24} />
                <Skeleton variant="text" width="88%" height={24} />
                <Skeleton variant="text" width="65%" height={24} />
            </Paper>
            
            <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />
        </Paper>
    </Box>
);

// Search form loading overlay
export const SearchFormSkeleton = () => (
    <Paper elevation={3} sx={{ p: 3, position: 'relative' }}>
        {/* Overlay */}
        <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'inherit',
            zIndex: 1000
        }}>
            <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    justifyContent: 'center',
                    mb: 2
                }}>
                    {[0, 0.3, 0.6].map((delay, index) => (
                        <Box 
                            key={index}
                            sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                backgroundColor: 'primary.main',
                                animation: 'bounce 1.4s ease-in-out infinite both',
                                animationDelay: `${delay}s`,
                                '@keyframes bounce': {
                                    '0%, 80%, 100%': { 
                                        transform: 'scale(0)',
                                        opacity: 0.3
                                    },
                                    '40%': { 
                                        transform: 'scale(1)',
                                        opacity: 1
                                    }
                                }
                            }} 
                        />
                    ))}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Durchsuche Archiv...
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                    Dies kann einen Moment dauern
                </Typography>
            </Box>
        </Box>
        
        {/* Background skeleton content */}
        <Skeleton variant="text" width="50%" height={40} />
        <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 1 }} />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" width="48%" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width="48%" height={56} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 3, borderRadius: 1 }} />
    </Paper>
);

// Keyword analysis skeleton
export const KeywordAnalysisSkeleton = () => (
    <Paper elevation={3} sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="text" width="70%" height={24} sx={{ mt: 1, mb: 3 }} />
        
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2, borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 3, borderRadius: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    justifyContent: 'center',
                    mb: 2
                }}>
                    {[0, 0.2, 0.4].map((delay, index) => (
                        <Box 
                            key={index}
                            sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                backgroundColor: 'primary.main',
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
                <Typography variant="body2" color="text.secondary">
                    Analysiere Schlüsselwörter...
                </Typography>
            </Box>
        </Box>
    </Paper>
);
