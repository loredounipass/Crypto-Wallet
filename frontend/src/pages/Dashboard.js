import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Divider
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import useAllWallets from '../hooks/useAllWallets';
import { getCoinLogo, getCoinFallbackLogo } from '../components/utils/Chains';
import { useHistory } from 'react-router-dom';

const Dashboard = () => {
  const { allWalletInfo, walletBalance } = useAllWallets();
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();
  const handleCoinImageError = (coin) => (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = getCoinFallbackLogo(coin);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
      borderRadius: 4,
      border: `1px solid ${color}33`,
      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: `0 8px 24px ${color}22`
      }
    }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const WalletCard = ({ wallet }) => (
    <Card 
      sx={{ 
        mb: 2,
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)'
        }
      }}
      onClick={() => history.push(`/wallet/${wallet.coin.toLowerCase()}`)}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Avatar
              src={getCoinLogo(wallet.coin)}
              imgProps={{ onError: handleCoinImageError(wallet.coin) }}
              sx={{ width: 40, height: 40, mr: 2 }}
            />
            <Box>
              <Typography variant="h6">{wallet.coin}</Typography>
              <Typography variant="body2" color="textSecondary">
                Balance: {wallet.balance}
              </Typography>
            </Box>
          </Box>
          <IconButton>
            <SwapHorizIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to BlockVault
          </Typography>
        </Grid>

        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Balance"
            value={`$${parseFloat(walletBalance).toFixed(2)}`}
            icon={<AccountBalanceWalletIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <StatCard
            title="Active Wallets"
            value={allWalletInfo.length}
            icon={<TrendingUpIcon />}
            color={theme.palette.success.main}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Transactions"
            value="Coming Soon"
            icon={<SwapHorizIcon />}
            color={theme.palette.warning.main}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 3 }} />
        </Grid>

        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%)'
            }}
          >
            <Typography variant="h5" gutterBottom>
              Your Wallets
            </Typography>
            <Grid container spacing={3}>
              {allWalletInfo.map((wallet, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <WalletCard wallet={wallet} />
                </Grid>
              ))}
            </Grid>
            {allWalletInfo.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  No wallets found
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => history.push('/wallets')}
                  sx={{ mt: 2 }}
                >
                  Create Wallet
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
