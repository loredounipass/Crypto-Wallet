import * as React from 'react';
import useAllWallets from '../hooks/useAllWallets';
import { useTranslation } from 'react-i18next'; 

import {
    Typography,
    Link,
    Grid,
    Paper,
    Box,
    Button,
    useMediaQuery,
    useTheme
} from '../ui/material';
import { getCoinLogo, getCoinFallbackLogo } from './utils/Chains';
import { getDisplayableAddress } from './utils/Display';

export default function MyWallets() {
    const { t } = useTranslation();
    const { allWalletInfo } = useAllWallets();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const handleCoinImageError = (coin) => (event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = getCoinFallbackLogo(coin);
    };

    return (
        <Box sx={{ width: '100%', padding: isSmallScreen ? 0.5 : 2, marginBottom: isSmallScreen ? 2 : 4 }}>
            {isSmallScreen ? (
                <Grid container spacing={1}>
                    {allWalletInfo.map((wallet) => (
                        <Grid item xs={12} key={wallet.walletId}>
                            <Paper sx={{
                                padding: 1.5, 
                                marginBottom: 1,
                                borderRadius: 2, 
                                boxShadow: 3, 
                                backgroundColor: theme.palette.background.paper,
                            }}>
                                <Grid container spacing={1} direction='column'>
                                    <Grid item>
                                        <Typography variant='body2' fontWeight='bold'>
                                        {t('currency')}: {/* Usar t para traducir */}
                                        </Typography>
                                        <Grid container spacing={0.5} alignItems='center'>
                                            <Grid item>
                                                <img
                                                    width={20}
                                                    src={getCoinLogo(wallet.coin)}
                                                    alt={wallet.coin}
                                                    onError={handleCoinImageError(wallet.coin)}
                                                />
                                            </Grid>
                                            <Grid item>
                                                <Typography variant='body2'>{wallet.coin}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid item>
                                        <Typography variant='body2' fontWeight='bold'>
                                        {t('address')}: 
                                        </Typography>
                                        <Link underline='none' href={`/wallet/${wallet.coin.toLowerCase()}`}>
                                            <Typography variant='body2' color='primary'>
                                                {getDisplayableAddress(wallet.address)}
                                            </Typography>
                                        </Link>
                                    </Grid>
                                    <Grid item>
                                        <Typography variant='body2' fontWeight='bold'>
                                        {t('balance')}: 
                                        </Typography>
                                        <Typography variant='body2'>{wallet.balance}</Typography>
                                    </Grid>

        
                                    <Grid item>
                                        <Link 
                                            href={`/wallet/${wallet.coin.toLowerCase()}`} 
                                            underline='none' 
                                            style={{ width: '100%' }}
                                        >
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                fullWidth 
                                                sx={{
                                                    marginTop: 1,
                                                    padding: isSmallScreen ? '6px 12px' : '8px 16px', 
                                                    fontSize: isSmallScreen ? '0.75rem' : '0.875rem', 
                                                    borderRadius: '16px', 
                                                }}
                                            >
                                                {t('view_details')} 
                                            </Button>
                                        </Link>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box sx={{ overflowX: 'auto' }}>
                    <Grid container spacing={2}>
                        {allWalletInfo.map((wallet) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={wallet.walletId}>
                                <Paper sx={{
                                    padding: 2, 
                                    borderRadius: 2, 
                                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                                    backgroundColor: theme.palette.background.paper,
                                    border: '1px solid rgba(0, 0, 0, 0.1)',
                                    minHeight: '100px',
                                }}>
                                    <Grid container spacing={1} alignItems='center'>
                                        <Grid item>
                                            <img
                                                width={20}
                                                src={getCoinLogo(wallet.coin)}
                                                alt={wallet.coin}
                                                onError={handleCoinImageError(wallet.coin)}
                                            />
                                        </Grid>
                                        <Grid item xs>
                                            <Typography variant='body2' component='div'>
                                                {wallet.coin}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container spacing={1} direction='column' sx={{ marginTop: 0.5 }}>
                                        <Grid item>
                                            <Typography variant='body2' fontWeight='bold'>
                                            {t('address')}: 
                                            </Typography>
                                            <Link underline='none' href={`/wallet/${wallet.coin.toLowerCase()}`}>
                                                <Typography variant='body2' color='primary'>
                                                    {getDisplayableAddress(wallet.address)}
                                                </Typography>
                                            </Link>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant='body2' fontWeight='bold'>
                                            {t('balance')}: 
                                            </Typography>
                                            <Typography variant='body2'>{wallet.balance}</Typography>
                                        </Grid>

                                       
                                        <Grid item>
                                            <Link 
                                                href={`/wallet/${wallet.coin.toLowerCase()}`} 
                                                underline='none' 
                                                style={{ width: '100%' }}
                                            >
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    fullWidth 
                                                    sx={{
                                                        marginTop: 1,
                                                        padding: isSmallScreen ? '6px 12px' : '8px 16px', 
                                                        fontSize: isSmallScreen ? '0.75rem' : '0.875rem', 
                                                        borderRadius: '16px'
                                                    }}
                                                >
                                                    {t('view_details')} 
                                                </Button>
                                            </Link>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
}
