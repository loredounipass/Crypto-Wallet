import React, { useEffect, useState, useContext, useMemo } from 'react';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import TotalBalance from './TotalBalance';
import MyWallets from './MyWallets';
import { AuthContext } from '../hooks/AuthContext';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
    const { t } = useTranslation();
    const { auth } = useContext(AuthContext);
    
    const texts = useMemo(() => [
        t('account_security_message'),
        t('crypto_potential_message'),
        t('p2p_service_message'),
        t('blockchain_revolution_message'),
        t('password_security_message'),
        t('crypto_wallet_services_message'),
        t('p2p_exchange_service_message')
    ], [t]);

    const [textIndex, setTextIndex] = useState(0);
    const [visibleText, setVisibleText] = useState(texts[0]);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const fadeOutDuration = 1000;
        const displayDuration = textIndex === 1 ? 8000 : 5000;

        const timeout1 = setTimeout(() => {
            setFadeOut(true);
        }, displayDuration);

        const timeout2 = setTimeout(() => {
            setTextIndex((prev) => (prev + 1) % texts.length);
            setFadeOut(false);
        }, displayDuration + fadeOutDuration);

        return () => {
            clearTimeout(timeout1);
            clearTimeout(timeout2);
        };
    }, [textIndex, texts]);

    useEffect(() => {
        setVisibleText(texts[textIndex]);
    }, [textIndex, texts]);

    return (
        <Grid container spacing={3} sx={{ padding: 2 }}>
            <Grid item xs={12}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={5} lg={4}>
                        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 300, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', border: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
                            <Typography variant="h6" sx={{ mb: 2, color: 'black', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)' }}>
                                 {t('account')}
                            </Typography>
                            <TotalBalance />
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={7} lg={8}>
                        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 300, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', border: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
                            <Typography variant="h6" sx={{ mb: 2, color: 'black', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)' }}>
                                {t('welcome', { firstName: auth?.firstName, lastName: auth?.lastName })}
                            </Typography>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    mb: 2, 
                                    fontSize: '1.1rem', 
                                    fontWeight: 'bold', 
                                    color: 'blue', 
                                    transition: 'opacity 0.5s ease', 
                                    opacity: fadeOut ? 0 : 1 
                                }}>
                                {visibleText}
                            </Typography>
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 'auto', flexWrap: 'wrap' }}>
                                {['/wallets', '/wallets', '/settings'].map((link, index) => (
                                    <Link key={index} to={link} style={{ textDecoration: 'none', marginBottom: '8px' }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            sx={{
                                                mr: 1,
                                                bgcolor: '#2196F3',
                                                borderRadius: '10px',
                                                '&:hover': { bgcolor: '#1976D2' }, 
                                                boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)', 
                                                minWidth: '70px', 
                                                fontSize: '0.85rem', 
                                                padding: '6px 13px', 
                                                transition: 'all 0.3s ease', 
                                            }}
                                        >
                                            {index === 0 ? t('deposit') : index === 1 ? t('withdraw') : t('security')}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        </Paper>
                    </Grid>
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', border: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'black', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)' }}>
                        {t('my_wallets')}
                    </Typography>
                    <MyWallets />
                </Paper>
            </Grid>
        </Grid>
    );
}

export default Dashboard;
