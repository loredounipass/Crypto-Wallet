import React from 'react';
import { Link } from '../ui/material';
import { Typography } from '../ui/material';
import { Wallet as WalletIcon } from '../ui/icons';
import Title from './utils/Title';
import useAllWallets from '../hooks/useAllWallets';
import { Box } from '../ui/material'; 
import { useTranslation } from 'react-i18next';

const TotalBalance = () => {
    const { walletBalance } = useAllWallets();
    const { t } = useTranslation();

    return (
        <React.Fragment>
            <Title>{t('total_balance_title')}</Title>
            <Typography component="p" variant="h4" sx={{ mb: 1 }}>
                ${parseFloat(walletBalance).toFixed(2)}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                {t('total_balance_amount')}
            </Typography>
            <Box
                sx={{
                    mt: 2, 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Link
                    color="primary"
                    href="/wallets"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        fontSize: '1rem', 
                        padding: '8px 18px', 
                        borderRadius: '10px', 
                        backgroundColor: '#2196F3', 
                        color: 'white', 
                        boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)', 
                        transition: 'all 0.3s ease', 
                        '&:hover': {
                            backgroundColor: '#1976D2', 
                            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)', 
                        },
                    }}
                >
                    <Typography variant="body1" sx={{ mr: 1 }}>
                        {t('my_wallets')}
                    </Typography>
                    <WalletIcon
                        sx={{
                            color: 'white', 
                            fontSize: '1.75rem',
                        }}
                    />
                </Link>
            </Box>
        </React.Fragment>
    );
};

export default TotalBalance;